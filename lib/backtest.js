//Бэктест / локальная песочница для старых данных
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

module.exports = function (){
	this.time 		= new Date(0); // время в симуляции
	this.brokerOrders 	= []; // текущие ордера робота
	this.brokerPositions 	= []; //текущее портфолио робота
	this.money 		= 0; //	баланс валюты
	this.currency   = 'RUB'; 
	this.history    = []; //исторические свечи
	this.quantity   = 0; //текущее количество инструментов
	this.comissions = 0;
	this.trades     = {
		'Buy'  : [],
		'Sell' : []
	};

	//	Аналог функции брокера для запрос ордеров
	this.GetOrders 	= function(){
		return {'orders' : this.brokerOrders};
	}

	//	Аналог функции брокера для запроса порфтолио
	this.GetPortfolio = function(){
		let positions = copy(this.brokerPositions);
		positions.push({
	      "figi": "FG0000000000",
	      "instrumentType": "currency",
	      "quantity": `${this.money} ${this.currency}` 
	    });
		return {'positions' : positions};
	}

	//	Аналог функции брокера для запроса добавление денег
	this.PayIn = function(opt){
    	web.render('backtestStatus', 'Зарабатываем деньги');
		let [amount, currency] = opt.amount.split(' ');
		this.money = amount;

    	web.render('backtestStatus', 'Заработали '+ amount + this.currency);
		return {'balance' : this.money};
	}

	//	Аналог функции брокера для заявки
	this.PostOrder = function(opt){
		this.brokerOrders.push({
	      "order_id": uuidv4(),
	      "execution_report_status": "EXECUTION_REPORT_STATUS_NEW",
	      "lots_requested": opt.quantity,
	      "lots_executed": "0",
	      "price":opt.price,
	      "initial_order_price": opt.price,
	      "figi": "BBG004S68598",
	      "direction": opt.direction,
	      "initial_security_price": opt.price,
	      "currency": this.currency,
	      "order_type": opt.order_type,
	      "order_date": this.time
	    });

	    return this.brokerOrders[this.brokerOrders.length - 1];
	}

	//	Аналог функции брокера для отмены
	this.CancelOrder = function(opt){
		for (let i in this.brokerOrders){
			if (this.brokerOrders[i]?.order_id == opt.order_id){
				this.brokerOrders.splice(i, 1);
				return {'time':this.time};
			}
		}
		return {'error':'order not found'};
	}

	//	 установка времени симуляции
	this.setTime = function (time){
		if(time==undefined){
			time = this.history[0].time;
		}
		this.time = time;
    	web.render('backtestTime', moment(time).format('YYYY-MM-DD HH:mm'));
	}

	//	Выгружаем прошлые свечи с кэшированием локальным
	this.loadHistory = async function(start, end){
		log('backtest.loadHistory', `start from ${moment(start).format()} to ${moment(end).format()}`, 'global');
    	web.render('backtestStatus', 'Загружаем историю');

		this.history = [];
		if (end.getTime() - start.getTime() > 1000 * 60 * 60 * 24 * 365){
    		web.render('backtestStatus', 'Период не может быть более 365 дней');
    		return;
		}

		var from = copy(start);
		var to = new Date(moment(from).add(1, 'days'));


		while(from < end){
			var path = `./cache/${options.instrument}_${moment(from).format('YYYYMMDD')}_${moment(to).format('YYYYMMDD')}.json`;
			if (fs.existsSync(path)) {
				var candles = JSON.parse(fs.readFileSync(path));

				for(let c of candles.candles){
					c.time = new Date(c.time);
				}
			}else{
				var candles = await broker.MarketData.GetCandles({
				  "figi"	: options.instrument,
				  "from"	: from,
				  "to"		: to,
				  "interval": "CANDLE_INTERVAL_1_MIN"
				});
				fs.writeFileSync(path, JSON.stringify(candles));

				await sleep(Math.floor(60 * 1000 / options.limit.marketData));
			}
			
			from = new Date(moment(from).add(1, 'days'));
			to   = new Date(moment(to).add(1, 'days'));

			log('loadHistory', `from ${moment(from).format()} to ${moment(to).format()} candles ${candles.candles.length}`, 'global');
			for(let c of candles.candles){
				this.history.push(c);
			}
			web.render('backtestHistrory', `from = ${moment(start).format('YYYY-MM-DD')} <br> to = ${moment(to).format('YYYY-MM-DD')} <br> candles = ${this.history.length}`);

		}

    	web.render('backtestStatus', 'История загружена');
	}

	this.clear = function (){
		candleHistory = [];
	}

	//	Запуск симуляции speed время задержки между обработкой свечей для удобного просмотра в режиме realTime процесс работы
	this.start = async function(speed){
		if (options.workmode != 'backtest'){
    		web.render('backtestStatus', 'Уверен? Будет сначала весело, а потом грустно. PS. Не стоит запускать симуляцию в боевом режиме.');
    		return;
		}

		this.clear();

		log('orders', this.brokerOrders, 'debug');
		//Подгружаем текущую стратегию
		var strategy  = require('../strategy/' + options.strategy);

		for (let i in this.history){
			if (options.workmode != 'backtest'){ //Остановка симуляции
	    		return;
			}

			let currentCandle = this.history[i];
			let previusCandle = this.history[i-1];
			web.render('backtestBalanceAll', fixPrice(this.money + this.quantity * currentCandle.close) );

			await this.simulate(currentCandle, previusCandle); //проверяем сработала ли сделка, мотаем время
			//Лайфхак используем методы основного модуля, что гарантирует одинаковую обработку в реальном контуре и тестовом, а так же сокращает количество кода
		    await app.candle(currentCandle, 'backtest'); //Добавляем следующую свечу
			await app.ordersSync(true); //Синхронизируем список заявок
			await app.balanceSync(true); // Синхронизируем балансы
		    await app.step(true); //Включаем робота и стратегию
			await sleep(speed); // Притормаживаем работу робота если нужно визуально наблюдать процесс работы
		}
	}

	this.simulate = async function (candle, previusCandle){
		log('sim', {'time':candle.time, 'open':candle.open}, 'debug');
		this.setTime(candle.time);
		for(let order of this.brokerOrders){
			if (order.direction == 'ORDER_DIRECTION_BUY'){
				log('simulate', 'Проверяем ордер' + candle.high + '<' + order.price + ` || ${previusCandle.close} > ${order.price}`, 'global' );
				if (candle.high < order.price || previusCandle.close > order.price){

					if (candle.high < order.price){
						var tradePrice = order.price; //Сработала лимитная заявка в течении минуты
					}
					if (previusCandle.close > order.price){
						var tradePrice = previusCandle.close; //Сработала маркет заявка сразу об последнюю свечу
					}

					log('simulate', 'Покупаем: ' + tradePrice + 'x' + order.lots_requested);
					let comission = Math.ceil(order.lots_requested * tradePrice * options.comission*100)/100;
					this.money -= order.lots_requested * tradePrice - comission;
					this.comissions += comission;
					this.CancelOrder({'order_id': order.order_id});
					this.quantity = this.addPosition(options.instrument, order.lots_requested);
					this.trades.Buy.push(candle.time, tradePrice);

					web.render('backtestComission', fixPrice(this.comissions));
					web.render('backtestBalanceAll', fixPrice(this.money + this.quantity * candle.close) );
				}
			}

			if (order.direction == 'ORDER_DIRECTION_SELL'){
				log('simulate', 'Проверяем ордер' + candle.low + '>' + order.price + ` || ${previusCandle.close} < ${order.price}`, 'global' );
				if (candle.low > order.price || previusCandle.close < order.price){

					if (candle.low > order.price){
						var tradePrice = order.price; //Сработала лимитная заявка в течении минуты
					}
					if (previusCandle.close < order.price){
						var tradePrice = previusCandle.close; //Сработала маркет заявка сразу об последнюю свечу
					}

					log('simulate', 'Продаем: ' + tradePrice + 'x' + order.lots_requested);
					let comission = Math.ceil(order.lots_requested * tradePrice * options.comission*100)/100;
					this.money += order.lots_requested * tradePrice - comission;
					this.comissions += comission;
					this.CancelOrder({'order_id': order.order_id});
					this.quantity = this.delPosition(options.instrument, order.lots_requested);
					this.trades.Sell.push(candle.time, tradePrice);
					
					web.render('backtestComission', fixPrice(this.comissions));
					web.render('backtestBalanceAll', fixPrice(this.money + this.quantity * candle.close) );
				}
			}
		}
	}

	//Добавляем позицию
	this.addPosition = function(figi, count){
		count = parseInt(count);
		for (let p of this.brokerPositions){
			if (p.figi == figi){
				p.quantity+=count;
				return p.quantity;
			}
		}

		this.brokerPositions.push({
	      "figi": figi,
	      "quantity": count
	    });
	    return count;
	}

	//Уменьшаем позицию
	this.delPosition = function(figi, count){
		count = parseInt(count);
		for (let p of this.brokerPositions){
			if (p.figi == figi){
				p.quantity-=count;
				return p.quantity;
			}
		}

		this.brokerPositions.push({
	      "figi": figi,
	      "quantity": -count
	    });

		return -count;
	}

	return this;
}

