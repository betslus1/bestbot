//Copyright © 2022 Vitaliy S.
//Licensed under the Apache License, Version 2.0


//globals include
options          = require('./options'); //Настройки
helpers          = require('./lib/helpers'); //Вспомогательные функции
backtest         = new (require('./lib/backtest'))(); //Модуль для бэктеста
directmode       = new (require('./lib/directmode'))(); //Модуль для конкурса Оригинальности

db               = require('./lib/db'); //Драйвер базы данных, при необходимости заменить на свой
copy             = require('fast-copy'); //Копирование объектов без ссылок
tinkoff_v2       = require ('./lib/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS/tinkoff_v2.js'); //NODEJS SDK собственной разработки
broker           = new tinkoff_v2({
  'token'   : options.token,
  'appname' : options.appname,
});

logger           = require('./lib/logger');//Драйвер для логирования
web              = require('./lib/web');  //Управление веб интерфейсом
consoleUI        = require('./lib/console-ui'); //Управление консольным интерфейсом
tablify          = require('tablify'); //Модули преобразования объектов в таблицы
html             = require('@tillhub/tableify');
moment           = require('moment');//Модуль работы со временем

//Внутренние параметры текущего аккаунта
stream           = false;
balance          = {};
orders           = {
  'ORDER_DIRECTION_BUY'  : {},
  'ORDER_DIRECTION_SELL' : {},
};
instruments      = {};
newCandle        = {'time':new Date(0),o:0,l:0,h:0,c:0,v:0};
candleHistory    = [];
sandboxBalance   = 0;
backtestBalance  = 0;
realBalance			 = 0;
exchangeStatus   = false;
errorsCount      = 0;
lockTime         = 0; //Задержки в работе робота для избежания проблем с лагами брокера
brokerIsWork     = true; //Флаг нормальной работы брокера

//locals
const { v4: uuidv4 } = require('uuid');
const fs         = require('fs');
const CronJob    = require('cron').CronJob; //Планировщик

const jobs       = {};
const isLog      = options.isLog; //Дополнительные параметры отображение в обзем логе

//Инициализация 
async function init(){
  if( !await app.findAccount() ){ //Поиск текущего Account'a и проверка на соотетствие того который в options.js
    log('init', 'Аккаунт не найден, проверьте настройки', 'error');
    process.exit();
  }

  if (options.workmode == 'sandbox'){
    await app.findSandBoxAccount();   //Поиск текущего sandboxAccount'a или создание нового если их нет
  }

  await db.init(); //Проверка существования БД, подключение, создаение структуры
  await app.loadHistory();//Подгрузка истории свечей
  await app.loadInstruments();//Выгрузка списка инструментов

  await app.subscribeStream();//Подключение к стримам свечей/info/стакана
  await app.balanceSync();//Обновление балансов
  await app.ordersSync();//Обновление списка заявок
  await app.loadTrades();//Синхронизация сделок

  //Периодическое обновление, можно заменить периодичность
  jobs['step']        = new CronJob('*/5 * 7-23,0-2 * * 1-5', app.step, 			 null, true, 'Europe/Moscow'); //с пн по пятницу с 7 утра до 2 ночи каждые 5 сек
  jobs['balanceSync'] = new CronJob('*/3 * 7-23,0-2 * * 1-5', app.balanceSync, null, true, 'Europe/Moscow');
  jobs['ordersSync']  = new CronJob('*/3 * 7-23,0-2 * * 1-5', app.ordersSync,  null, true, 'Europe/Moscow');
  jobs['loadTrades']  = new CronJob('0   * 7-23,0-2 * * 1-5', app.loadTrades,  null, true, 'Europe/Moscow');
  jobs['clearError']  = new CronJob('0   0 7-23,0-2 * * 1-5', app.clearError,  null, true, 'Europe/Moscow'); //Сброс счетчика ошибок
}

//Главный модуль робота
app = new (function (){

  //Обновление балансов
  this.balanceSync = async function (isSim){
    if(isSim == undefined && options.workmode == 'backtest'){ //Отключаем для симуляций и бэктеста
      return;
    }
    log('balanceSync', `START`, 'global', isLog.balanceSync); 

    try{
      //Выбираем имя метода в зависимости от режима работы
      if (options.workmode == 'real'){
        var portfolio = (await broker.Operations.GetPortfolio({'account_id': options.tradeAccount})); 
      }

      if (options.workmode == 'sandbox'){
        var portfolio = (await broker.Sandbox.GetSandboxPortfolio({'account_id': options.sandboxAccountId})); 
      }

      if (options.workmode == 'backtest'){
        var portfolio = (await backtest.GetPortfolio()); 
      }

      if (portfolio == undefined || !Array.isArray(portfolio?.positions)){
        throw {'type':'error', 'desc' : 'Не удалось обновить балансы'};
      }

      var balanceOld = copy(balance);
      var balanceNew = {};
      for (const port of portfolio.positions) {
          balanceNew[port.figi] = port;
      }

      for (const figi of Object.keys(balanceOld)) {
         if(balanceNew[figi] == undefined){
           balanceNew[figi] = false;
         }
      }

      balance = copy(balanceNew);


       await consoleUI.renderStatus(); //Отображаем в интерфейсе
       if(options.workmode == 'sandbox'){
         realBalance = balance['FG0000000000']?.quantity;
         web.render('realBalance', fixPrice(realBalance));
       }
       if(options.workmode == 'sandbox'){
         sandboxBalance = balance['FG0000000000']?.quantity;
         web.render('sandboxBalance', fixPrice(sandboxBalance));
       }
       if(options.workmode == 'backtest'){
         backtestBalance = balance['FG0000000000']?.quantity;
         web.render('backtestBalance', fixPrice(backtestBalance));
       }
    }catch(err){
      brokerIsWork = false;
      log('balanceSync', new String(err), 'error');
    }

    brokerIsWork = true;
    log('balanceSync', 'FINISH', 'global', isLog.balanceSync);
  }

  //Синхронизация сделок
  this.ordersSync = async function (isSim){
    if(isSim == undefined && options.workmode == 'backtest'){
      return;
    }
    log('ordersSync', `START`, 'global', isLog.ordersSync); 

    try{
      if (options.workmode == 'real'){
        var resp = await broker.Orders.GetOrders({'account_id': options.tradeAccount}); 
      }

      if (options.workmode == 'sandbox'){
        var resp = await broker.Sandbox.GetSandboxOrders({'account_id': options.sandboxAccountId}); 
      }

      if (options.workmode == 'backtest'){
        var resp = (await backtest.GetOrders()); 
      }

      if (resp == undefined || !Array.isArray(resp?.orders)){
        throw {'type':'error', 'desc' : 'Не удалось обновить заявки'};
      }

      orders           = {
        'ORDER_DIRECTION_BUY'  : {},
        'ORDER_DIRECTION_SELL' : {},
      };

      for (const o of resp?.orders ) {
          orders[o.direction][o.figi] = o;
      }
    }catch(err){
      brokerIsWork = false;
      log('ordersSync', JSON.stringify(err), 'error');
    }


    await consoleUI.renderStatus();
    brokerIsWork = true;
    log('ordersSync', 'FINISH', 'global', isLog.ordersSync);
  }

  //Подключаем стрим данных
  this.subscribeStream = async function (){
    stream = broker.MarketDataStreamService.MarketDataStream();

    stream.on('data', function(msg) {
      if(options.workmode == 'backtest'){
      return;
      }
      if (msg.payload == 'orderbook'){
        return app.orderbook(msg.orderbook);
      }
      if (msg.payload == 'candle'){
        return app.candle(msg.candle, 'stream');
      }
      if (msg.payload == 'trading_status'){
        return app.infoMsg(msg, 'stream');
      }

      log('stream', JSON.stringify( msg ), 'debug');
    });
    stream.on('error', function(e) {
      log('stream', 'error: ' + JSON.stringify( e ), 'error');
    });
    stream.on('status', function(status) {
      log('stream', 'status: ' + JSON.stringify( status ), 'debug');
    });
    stream.on('end', function() {
      log('stream', 'socket end', 'error');
    });


    stream.write({  
      "subscribe_candles_request": {    
        "subscription_action": "SUBSCRIPTION_ACTION_SUBSCRIBE",   
         "instruments": [
          {"figi": options.instrument, "interval" : "SUBSCRIPTION_INTERVAL_ONE_MINUTE"},
          ]                         
        }                     
    });

    stream.write({  
          'subscribe_info_request': {
            'subscription_action': 'SUBSCRIPTION_ACTION_SUBSCRIBE',
            "instruments": [
          {"figi": options.instrument},
            ]  
        }                  
    });
        
    stream.write({  
      "subscribe_order_book_request": {    
        "subscription_action": "SUBSCRIPTION_ACTION_SUBSCRIBE",   
         "instruments": [
          {"figi": options.instrument, "depth" : 20},
            ]                         
        }                     
    });
  }

  //Обработка сервисных сообщений
  this.infoMsg = async function(json){
    exchangeStatus = json.trading_status.trading_status;
    log('infoMsg', `exchangeStatus = ${exchangeStatus}`);
  }

  //Обработка стаканов из стрима
  this.orderbook = async function (orderbook){
    orderbook = broker.decodeResponse(orderbook, {'price' : 'Quotation', 'limit_up': 'Quotation', 'limit_down': 'Quotation', 'time':'google.protobuf.Timestamp'});
    if (orderbook.figi == directmode.figi){
      directmode.orderbook(orderbook);
      return;
    }
    
    consoleUI.render('bids', tablify(orderbook.bids??{}));
    consoleUI.render('asks', tablify(orderbook.asks??{}));
    web.render('bids',       html(orderbook.bids??{}));
    web.render('asks',       html(orderbook.asks??{}));
  }

  //Обработка свечей из стрима
  this.candle = async function (candle, source){
      if (source == 'stream'){
        candle = broker.decodeResponse(candle, {'open' : 'Quotation', 'high': 'Quotation', 'low': 'Quotation', 'close': 'Quotation', 'time':'google.protobuf.Timestamp', 'last_trade_ts':'google.protobuf.Timestamp'});
      }
    
      let oldCandle  = copy(newCandle);
      newCandle = {
        'time' : candle.time,
        'o'    : candle.open,
        'l'    : candle.low,
        'h'    : candle.high,
        'c'    : candle.close,
        'v'    : candle.volume
      };

      //Добавляем новую свечу или изменяем старую если новая минута еще не началась
      if (oldCandle.time < newCandle.time){
        candleHistory.push(newCandle);
      }else{
        candleHistory[candleHistory.length-1] = newCandle;
      }

      if (candleHistory.length > options.candleHistoryLenght){
        candleHistory.splice(0,1);
      }

      let shortCandles = [];
      for (let c of candleHistory){
        let newCandle = copy(c);
        newCandle.time = moment(newCandle.time).format('DD.MM HH:mm');
        shortCandles.push(newCandle);
      }
      shortCandles = shortCandles.splice(-10,10);
      consoleUI.render('candles', tablify(shortCandles??[]));
      web.render('candles', html(shortCandles??[]));

      var chartCandles = [];
      for(let c of candleHistory){
        chartCandles.push([c.time.getTime(), c.o, c.h, c.l, c.c])
      }
      web.charts(chartCandles);
  }

  //Запускаем работу стратегии для текущей рыночной обстановки
  this.step = async function(isSim) { 
    if(isSim == undefined && options.workmode == 'backtest'){
    	log('STEP', `Идет бэектест, пропускаем события основных контуров`, 'debug');
      return;
    }
    if (errorsCount > options.maxCountError || brokerIsWork == false){
    	log('STEP', `Брокер сломался, отключаем работу торгового контура`, 'global');
    	return;
    }
    if (realBalance < options.minMoneyBalance){
    	log('STEP', `Недостаточный баланс`, 'global');
    	return;
    }
    if (exchangeStatus != 'SECURITY_TRADING_STATUS_NORMAL_TRADING' || (new Date()).getTime() < lockTime){ //Костыль против лага в обновлении ордеров/балансов и тд задержка 10 сек после любых действий на аккаунте
      log('STEP', `Пропускаем шаг: exchangeStatus = ${exchangeStatus} || lockTime = ${(new Date()).getTime() - lockTime}`);
      return;
    }

    //COMPUTE STRATEGY
      log('step', `START`, 'debug', isLog.loadHistory); 
    let strategy      = require('./strategy/' + options.strategy);
    let currentOrder = {
      'Buy' : orders['ORDER_DIRECTION_BUY'][options.instrument] ?? false,
      'Sell': orders['ORDER_DIRECTION_SELL'][options.instrument] ?? false,
    };
    currentBalance   = balance[options.instrument]?.quantity ?? 0; //bug in API, quantity_lot not working in sandbox
    try{
      var {logs, commands, indicators, error} = strategy.step(candleHistory, currentOrder, currentBalance);
    }catch(error){
      log('step', new String(error), 'error');
    }
    log('step', JSON.stringify({logs, commands, indicators, error}), error?'error':'debug');

    //RENDER RESULTS
    consoleUI.clear();
    let htmlLog = '';
    if (Array.isArray(logs))
    for(let msg of logs){
      if (typeof msg == 'object' && Array.isArray(msg)){
        console.log(tablify(msg));
        htmlLog += '<p>' + html(msg) + '</p>';
      }else{
        console.log(msg);
        htmlLog += '<p>' + msg + '</p>';
      }
    }
    web.render('main', htmlLog);
    web.indicators(indicators);

    //EXECUTE COMMANDS
    if (Array.isArray(commands))
    for(let c of commands){
      if (c.type == 'cancel'){
        let resp = await app.cancelOrder({'order_id':c.order_id});
        log(c.type, resp, 'debug');
      }

      if (c.type == 'Buy' || c.type == 'Sell'){
        let resp = await app.postOrder({
          "quantity"   :   c.quantity,
          "price"      :   c.price,
          "direction"  :  (c.type == 'Buy') ? 'ORDER_DIRECTION_BUY' : 'ORDER_DIRECTION_SELL',
          "orderType"  :  'ORDER_TYPE_LIMIT',
        });

        log(c.type, resp, 'debug');
      }
    }
  }

  //Отправляем заявку на биржу
  this.postOrder = async function (opt){
    try{
      if (options.workmode == 'real'){
        lockTime = (new Date()).getTime() + 1000*10; //Ставим задержку 10 сек на будущие операции
      }
      let req = {
        "account_id" :   options.tradeAccount,
        "figi"       :   options.instrument,
        "quantity"   :   opt.quantity,
        "price"      :   opt.price,
        "direction"  :  opt.direction,
        "order_type"  :  opt.orderType,
        "order_id"    :  uuidv4()
      };

      if (options.workmode == 'real'){
        log('Real', 'PostOrder: ' + opt.direction + ' ' + req.price + 'x' + req.quantity, 'global');
        return await broker.Orders.PostOrder(req); 
      }

      if (options.workmode == 'sandbox'){
        req.account_id = options.sandboxAccountId;
        req.order_type = 'ORDER_TYPE_MARKET'; //bug in API, LIMIT ORDERS not working
        log('Sandbox', 'PostOrder: ' + opt.direction + ' ' + req.price + 'x' + req.quantity, 'global');
        return await broker.Sandbox.PostSandboxOrder(req); 
      }

      if (options.workmode == 'backtest'){
        log('Backtest', 'PostOrder: ' + opt.direction + ' ' + req.price + 'x' + req.quantity, 'global');
        return await backtest.PostOrder(req); 
      }
    }catch(err){
      log('postOrder', 'ERR: ' + (new String(err)) + JSON.stringify(err), 'error');
      return err;
    }
  }

  //Отменяем заявку
  this.cancelOrder =async function (opt){
    try{
      if (options.workmode == 'real'){
        lockTime = (new Date()).getTime() + 1000*10; //Ставим задержку 10 сек на будущие операции
      }
      let req = {
        "account_id": options.tradeAccount,
        "order_id": opt.order_id
      }

      if (options.workmode == 'real'){
        log('Real', 'cancelOrder: ' + req.order_id, 'global');
        return await broker.Orders.CancelOrder(req); 
      }

      if (options.workmode == 'sandbox'){
        req.account_id = options.sandboxAccountId;
        log('Sandbox', 'cancelOrder: ' + req.order_id, 'global');
        return await broker.Sandbox.CancelSandboxOrder(req); 
      }

      if (options.workmode == 'backtest'){
        log('Backtest', 'cancelOrder: ' + req.order_id, 'global');
        return await backtest.CancelOrder(req); 
      }
    }catch(err){
      log('cancelOrder', opt, 'global'); 
      log('cancelOrder', 'ERR: ' + (new String(err)) + JSON.stringify(err), 'error');
      return err;
    }
  }

  //Выгружаем все трейдсы и сохраняем в БД
  this.loadTrades = async function (){  
    log('loadTrades', 'START loadTrades', 'debug');
    try {
      var req = {
        "account_id": options.tradeAccount,
        "from"  : new Date(moment().subtract(60*24*14, 'minute')),
        "to"    : new Date(moment().add(1, 'minute')),
        "state": "OPERATION_STATE_EXECUTED"
      };

      var operations = await broker.Operations.GetOperations(req);

      for (let p of operations.operations){
        if (p.operation_type == 'OPERATION_TYPE_SELL' || p.operation_type == 'OPERATION_TYPE_BUY'){
          if (p.operation_type == 'OPERATION_TYPE_SELL'){
            var operationType = 'Sell';
          }
          if (p.operation_type == 'OPERATION_TYPE_BUY'){
            var operationType = 'Buy';
          }

          let inst = instruments[p.figi];
          if (inst == undefined){
            continue;
          }

          p.lots = Math.round(p.quantity / inst.lot);
          for (let q = 0; q<p.lots; q++){
            let req = [p.id, q, p.figi, operationType, p.date, p.instrument_type, p.currency, parseFloat(p.price), '', 0];
            await db.query("INSERT OR IGNORE INTO trade (id, n, figi, operationType, date, instrumentType, currency, price, pair, pair_n) VALUES (?,?,?,?,?,?,?,?,?,?)", req);
            insert++;
          }
        }      
      }
    }catch(err){
      log('loadTrades', new String(err), 'error');
    }

    log('loadTrades', 'FINISH', 'debug');  
    app.operationsSync();
  }

  //Объединяем трейдсы по методу FIFO для рассчета статистики, каждому трейду продажи ставится в соответствиие трейд покупки
  this.operationsSync = async function (){
    log('operationsSync', 'START operationsSync', 'global',  isLog.operationsSync);
    let rows = await db.select("SELECT * FROM trade WHERE pair='' AND operationType = 'Sell'");
    for(let row of rows){

      let figi    = row['figi'];
      let type    = 'shares';
      let quantity = balance[figi]?.quantity??0;

      if (quantity < 0) continue;

      
      let sell  = await db.select(`SELECT * FROM trade WHERE figi = '${figi}' AND pair = '' AND operationType = 'Sell' ORDER BY date desc`);
      let buy   = await db.select(`SELECT * FROM trade WHERE figi = '${figi}' AND pair = '' AND operationType = 'Buy' ORDER BY date desc LIMIT 99999 OFFSET ${quantity}`);

      for (let i in sell){
        if (buy[i]!=undefined){
          
          var res = await db.query("UPDATE trade SET pair = ?, pair_n=? WHERE id = ? and n = ?", [sell[i]['id'], sell[i]['n'], buy[i]['id'], buy[i]['n']]);
          var res = await db.query("UPDATE trade SET pair = ?, pair_n=? WHERE id = ? and n = ?", [buy[i]['id'], buy[i]['n'], sell[i]['id'], sell[i]['n']]);

          let buy_price  = parseFloat(buy[i]['price']);
          let sell_price = parseFloat(sell[i]['price']);
          let comission  = fixPrice((sell_price + buy_price) * 0.00025);
          let profit     = fixPrice(sell_price - buy_price - comission);

          if (sell[i]['currency'] == 'RUB'){
            var profit_RUB = profit;
          }else{
            var profit_RUB = profit * 70;
          }

          let req = [figi, sell[i]['date'], profit, comission, buy[i]['id']+'_'+buy[i]['n'], sell[i]['id']+'_'+sell[i]['n'], sell[i]['currency'], profit_RUB, type];
          await db.query("INSERT OR IGNORE INTO operations (`id`, `figi`, `date`, `profit`, `comission`, `buy`, `sell`, `currency`, `profit_RUB`, `type`) \
            VALUES (NULL,?,?,?,?,?,?,?,?,?)", req);
        }
      }
    }
    log('operationsSync', 'FINISH operationsSync', 'global', isLog.operationsSync);

  }

  //  Выгружаем последние свечи инструменты
  this.loadHistory = async function (){
    candleHistory = [];
    let history = await broker.MarketData.GetCandles({
      "figi"  : options.instrument,
      "from"  : new Date(moment().subtract(60, 'minute')),
      "to"    : new Date(moment().add(1, 'minute')),
      "interval": "CANDLE_INTERVAL_1_MIN"
    });

    for (let c of history.candles){
      this.candle(c, 'history');
    }

    log('app.loadHistory', `Load history: ${history.candles.length}`, 'global', isLog.loadHistory); 
  }

  //  Находим или создаем сэндбокс аккаунт
  this.findSandBoxAccount = async function (){
    try{
      var accounts = await broker.Sandbox.GetSandboxAccounts({});
    }catch(err){
      log('app.findSandBoxAccount', new String(err), 'error');
      return false;
    }
    if (Array.isArray(accounts?.accounts) && accounts?.accounts[0] != undefined){
      options.sandboxAccountId = accounts.accounts[0].id;
      log('app.findSandBoxAccount', 'Found sandboxAccountId = ' + options.sandboxAccountId, 'global');
    }else{
      let resp = await broker.Sandbox.OpenSandboxAccount({});
      log('app.findSandBoxAccount', JSON.stringify(resp), 'global');
      options.sandboxAccountId = resp.account_id;
    }
  }

  //  Находим или создаем сэндбокс аккаунт
  this.findAccount = async function (){
    try{
      var accounts = await broker.Users.GetAccounts({});
    }catch(err){
      if (err.includes('UNAUTHENTICATED')){
        log('app.findSandBoxAccount', 'Проверьте токен авторизации в файле options.js', 'error');
      }
      log('findAccount', new String(err), 'error');
      return false;
    }
    if (Array.isArray(accounts?.accounts) && accounts?.accounts[0] != undefined){
      for (let a of accounts.accounts){
        log('findAccount', 'Найден аккаунт в брокере: ' + a?.id + '['  + a?.name + ']', 'global');
        if (options.tradeAccount == a?.id){
          return true;
        }
      }
    }

    log('findAccount', 'На счете не найден аккаунт, проверьте настройки: options.tradeAccount = ' + options.tradeAccount, 'global');
    return false;
  }

  //Скачиваем список инструментов
  this.loadInstruments = async function (){
    let shares = await broker.Instruments.Shares({});

    for (let i of shares?.instruments){
      instruments[i.figi] = i;
    }

    log('app.loadInstruments', `Load instruments: ${shares?.instruments?.length}`, 'global', isLog.loadInstruments); 
  }

  this.clearError = function(){
    errorsCount = 0;
  }

  return this;

})();

//Запуск инициализации
init();
