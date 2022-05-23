//includes
var options   = require('../options');
var express   = require('express');
var webApp       = express();
var http = require('http').createServer(webApp);
var io = require('socket.io')(http, {'transports': ['websocket', 'polling', 'xhr-polling']});
var bodyParser = require('body-parser');


//HTTP часть веб интерфейса
webApp.set('view engine', 'ejs');
webApp.use('/css', express.static('lib/www/css'));
webApp.use('/js', express.static('lib/www/js'));
webApp.use('/img', express.static('lib/www/img'));
webApp.use('/sfx', express.static('lib/www/sfx'));
webApp.use('/.well-known', express.static('www/.well-known'));
webApp.use(bodyParser.urlencoded({ extended: false }));
webApp.use(bodyParser.json()); // parse webApplication/json

webApp.use((req, res, next) => {
  const auth = {'login': options.login, 'password': options.password};
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
  if (login === auth?.login && password === auth?.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
});

webApp.get('/', async function (req, res) {
  log('web', 'main.ejs', 'debug');

  let strategy = require('../strategy/' + options.strategy);
  res.render('main',{
    'indicatorList' : Object.keys(strategy.indicators),
    'indicators'    : strategy.indicators,
  });
});

webApp.get('/candles', async function (req, res) {
  let json = [];
  for(let c of candleHistory){
    json.push([c.time.getTime(), c.o, c.h, c.l, c.c])
  }
  res.json(json);
});

webApp.get('/trades', async function (req, res) {
  let json = {
    'buy':[],
    'sell':[],
  };

  let since = (new Date()).getTime() - 1000*3600;
  let buys  = await db.select("SELECT * FROM trade WHERE figi = '"+options.instrument+"' AND operationType = 'Buy' AND date > " + since + " GROUP BY date ORDER BY id DESC limit 100");
  let sells = await db.select("SELECT * FROM trade WHERE figi = '"+options.instrument+"' AND operationType = 'Sell' AND date > " + since + " GROUP BY date ORDER BY id DESC limit 100");

  if (Array.isArray(buys))
  for (let b of buys){
    let time = new Date(b.date);
    time.setMilliseconds(0);
    time.setSeconds(0);
    time = time.getTime();
    json.buy.push([time, b.price]);
  }

  if (Array.isArray(sells))
  for (let b of sells){
    let time = new Date(b.date);
    time.setMilliseconds(0);
    time.setSeconds(0);
    time = time.getTime();
    json.sell.push([time, b.price]);
  }

  res.json(json);
});

webApp.get('/directmode', async function (req, res) {
  res.render('directmode',{
    'instruments' : instruments,
  });
});

webApp.get('/logger', async function (req, res) {
  let logs = await db.select("SELECT * FROM log ORDER BY id DESC limit 10000");
  res.render('logger',{
    'logs' : logs,
  });
});

webApp.get('/operations', async function (req, res) {
  let operations = await db.select("SELECT * FROM operations ORDER BY id DESC limit 10000");
  res.render('operations',{
    'operations' : operations,
  });
});

webApp.get('/itog', async function (req, res) {
  let itog = await db.select("SELECT figi, SUM(profit) as profit, SUM(comission) as comission , SUM(profit_RUB) as profit_RUB FROM operations GROUP BY figi");
  res.render('itog',{
    'itog' : itog,
  });
});

webApp.get('/directmode/subscribe', async function (req, res) {
  stream.write({  
    "subscribe_order_book_request": {    
      "subscription_action": "SUBSCRIPTION_ACTION_UNSUBSCRIBE",   
       "instruments": [
          {"figi": directmode.figi, "depth" : 1},
        ]                         
      }                     
  });
  directmode.figi = req.query.figi;
  stream.write({  
    "subscribe_order_book_request": {    
      "subscription_action": "SUBSCRIPTION_ACTION_SUBSCRIBE",   
       "instruments": [
          {"figi": directmode.figi, "depth" : 1},
        ]                         
      }                     
  });
  res.send('Подписка активирована');
});

webApp.get('/main/subscribe', async function (req, res) {

  log('WEB', 'UNSUBCSRIBE : ' + options.instrument, 'global');
  stream.write({  
    'subscribe_info_request': {
          'subscription_action': 'SUBSCRIPTION_ACTION_UNSUBSCRIBE',
          "instruments": [
            {"figi": options.instrument},
          ]  
      }                  
  });

  stream.write({  
    "subscribe_candles_request": {    
      "subscription_action": "SUBSCRIPTION_ACTION_UNSUBSCRIBE",   
       "instruments": [
        {"figi": options.instrument, "interval" : "SUBSCRIPTION_INTERVAL_ONE_MINUTE"},
          ]                         
      }                     
  });

  stream.write({  
    "subscribe_order_book_request": {    
      "subscription_action": "SUBSCRIPTION_ACTION_UNSUBSCRIBE",   
       "instruments": [
        {"figi": options.instrument, "depth" : 20},
          ]                         
      }                     
  });

  options.instrument = req.query.figi;

  log('WEB', 'SUBCSRIBE : ' + options.instrument, 'global');
  stream.write({  
    "subscribe_candles_request": {    
      "subscription_action": "SUBSCRIPTION_ACTION_SUBSCRIBE",   
       "instruments": [
        {"figi": options.instrument, "interval" : "SUBSCRIPTION_INTERVAL_ONE_MINUTE"},
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

  stream.write({  
    'subscribe_info_request': {
          'subscription_action': 'SUBSCRIPTION_ACTION_SUBSCRIBE',
          "instruments": [
            {"figi": options.instrument},
          ]  
      }                  
  });

  app.loadHistory();
  res.send('Подписка активирована');
});

webApp.get('/loadHistory', async function (req, res) {
  let resp = backtest.loadHistory(new Date(req.query.from), new Date(req.query.to));
  res.send('OK');
});

webApp.get('/backtest/start', async function (req, res) {
  backtest.setTime();
  backtest.start(req.query.speed);
  res.send('Запуск');
});


webApp.get('/sandboxPayIn', async function (req, res) {
  let sum = req.query.sum;

  if (options.workmode == 'real'){
    web.render('realBalance', 'В настоящее время метод не поддерживается, обратитесь к Волкову с просьбой реализовать данный метод');
    log('WEB', '[BROKER]  RealPayIn : В настоящее время метод не поддерживается, обратитесь к Волкову с просьбой реализовать данный метод', 'global');
  }

  if (options.workmode == 'sandbox'){
    web.render('sandboxBalance', sum);
    var resp = await broker.Sandbox.SandboxPayIn({
      'account_id': options.sandboxAccountId, 
      'amount': sum + ' RUB'
    }); 

    log('WEB', '[BROKER] SandboxPayIn : ' + JSON.stringify(resp), 'global');
  }

  if (options.workmode == 'backtest'){
    web.render('backtestBalance', sum);
    var resp = await backtest.PayIn({
      'account_id': options.sandboxAccountId, 
      'amount': sum + ' RUB'
    }); 

    log('WEB','[BACKTEST] PayIn : ' + JSON.stringify(resp), 'global');
  }
  res.send(JSON.stringify(resp));
});


//WebSocket часть интерфейса
io.on('connection', (socket) => {
  log('WEB', '[socket.io] user connected', 'global');

  socket.on('renderStatus', function(json){
    log('WEB', `renderStatus`,'debug');
    consoleUI.renderStatus();
  });

  socket.on('workmode', async function(mode){
    log('WEB', 'workmode = ' + mode, 'global');
    if (options.workmode == 'sandbox' && mode != 'sandbox'){
      let resp = await broker.Sandbox.CloseSandboxAccount({'account_id': options.sandboxAccountId});
      log('WEB', '[BROKER] ' + JSON.stringify(resp));
    }

    if(options.workmode != 'sandbox' && mode == 'sandbox'){
      let resp = await broker.Sandbox.OpenSandboxAccount({});
      log('WEB', '[BROKER] ' + JSON.stringify(resp));
      options.sandboxAccountId = resp.account_id;
    }
    options.workmode = mode;
    consoleUI.renderStatus();
  });
});


http.listen(options.port, function () {
  log('WEB', `Web webApp listening on port ${options.port}!`, 'global');
});


//Методы для внешних обращений от других методов
module.exports.render = function(el, msg){
  io.sockets.emit('render', {el, msg});
}
 
module.exports.charts = function(candles){
  io.sockets.emit('charts', candles);
}

module.exports.indicators = function(indicators){
  io.sockets.emit('indicators', indicators);
}
module.exports.log = function(msg){
  io.sockets.emit('webAppend', {'el':'log', msg});
}

module.exports.game_ob = function(time, bids, asks){
  let htmlBids = [];
  let htmlAsks = []; 
  for (let i in bids){
    htmlBids.push(html(bids[i]));
    htmlAsks.push(html(asks[i]));
  }
  io.sockets.emit('game_bids', {time, htmlBids, htmlAsks, bids, asks});
}