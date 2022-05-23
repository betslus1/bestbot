"use strict";

var copy  = require('fast-copy');

var logs       = [];
var indicators = {};
var commands   = [];

const max_balance = 1;

module.exports.indicators = {
	'RSI':{
		'min':0,
		'max':100,
		'buy':49,
		'sell':51
	},
	'MA':{
		'min':0,
		'max':500,
	},
	'STOCH':{
		'min':0,
		'max':100,
		'buy':49,
		'sell':51
	},
	'MOM':{
		'min':-20,
		'max':20
	},
	'MIN':{
		'min':0,
		'max':500,
	},

	'MAX':{
		'min':0,
		'max':500,
	},

}


module.exports.step = function (lastCandles, currentOrder, currentBalance) {
  logs       = [];
  indicators = {};
  commands   = [];

	let lastCandle = lastCandles[lastCandles.length - 1];

	if (lastCandle?.c == undefined){
		return {'error':'Нет свечей'};
	}

	indicators.MAX   = calc_max(lastCandles);
	indicators.MIN   = calc_min(lastCandles);
	indicators.MA    = calc_MA(lastCandles);
	indicators.MOM   = calc_momentum(lastCandles, lastCandle.c);
	indicators.RSI   = calc_RSI(lastCandles);
	indicators.STOCH = calc_stohastic(lastCandles,lastCandle.c);


	let price = {
		'Buy'  : fixFloat(lastCandle.c*100.5/100), //+0.5%
		'Sell' : fixFloat(lastCandle.c*99.5/100),  //-0.5%
	};

	let quantity = {
		'Buy' : 1,
		'Sell': 1
	}


	//Добавляем немного непредсказуемости

	logs.push([['Вращаем барабан!']]);
	var isBuy = Math.round(Math.random());
	var isSell = Math.round(Math.random());

	logs.push([['isBuy', new String(isBuy)]]);
	logs.push([['isSell', new String(isSell)]]);


	//Нужно купить и есть заявка и цена не совпадает или не нужно покупать, отменяем заявку
	if (isBuy && currentOrder?.Buy && currentOrder.Buy.initial_order_price != price.Buy || !isBuy && currentOrder.Buy){
		commands.push({'type':'cancel', 'order_id':currentOrder.Buy.order_id});
		logs.push('Отменяем существующую заявку на покупку');
	}

	if (isSell && currentOrder?.Sell && currentOrder.Sell.initial_order_price != price.Sell || !isSell && currentOrder.Sell){
		commands.push({'type':'cancel', 'order_id':currentOrder.Sell.order_id});
		logs.push('Отменяем существующую заявку на продажу');
	}

	//Цена изменилась или нет выставленной заявки а купить надо
	logs.push(`[BUY]: Надо купить = ${isBuy}, Цена отличается = ${currentOrder?.Buy?.initial_order_price != price.Buy}, Баланс нормальный (${currentBalance} < ${max_balance}) = ${currentBalance < max_balance}`);
	if (isBuy && currentOrder?.Buy?.initial_order_price != price.Buy && currentBalance < max_balance){
		commands.push({'type':'Buy', 'price':price.Buy, 'quantity': quantity.Buy});
		logs.push(`Покупаем: ${price.Buy} x ${quantity.Buy}`);
	}

	logs.push(`[SELL]: Надо продать = ${isSell}, Цена отличается = ${currentOrder?.Sell?.initial_order_price != price.Sell}, Баланс нормальный = ${currentBalance > 0}`);
	if (isSell && currentOrder?.Sell?.initial_order_price != price.Sell && currentBalance > 0){
		commands.push({'type':'Sell', 'price':price.Sell, 'quantity': quantity.Sell});
		logs.push(`Продаем: ${price.Sell} x ${quantity.Buy}`);
	}

	return {logs, commands, indicators};
}

function calc_momentum(candles, price, opt){
  let MA = calc_MA(candles);
  return fixFloat((price - MA) / price * 100*100);
}

function calc_MA(candles, opt){
  let sum = 0;
  for (let candle of candles){
    let candlePrice   = (candle.l + candle.h) * 0.5;
    sum += candlePrice;
  }
  return fixFloat(sum/candles.length);
}

function calc_max(candles){
  let max = 0;
  for (let c of candles){
    if (c.h > max){
      max = c.h
    }
  }
  return max;
}

function calc_min(candles){
  let min = 99999999;
  for (let c of candles){
    if (c.l < min){
      min = c.l
    }
  }
  return min;
}

function calc_RSI(candles, opt){
  let sumU   = 0;
  let countU = 0;
  let sumD = 0;
  let countD = 0;
  var previousCandle = undefined;
  var closes = [];
  var prices = [];

  for (let i in candles){
    let prevCandle = candles[i-1];
    let curCandle  = candles[i];

    if(prevCandle == undefined){
      continue;
    }
    
    closes.push(fixFloat(curCandle.c - prevCandle.c));
    prices.push(fixFloat(curCandle.c));

    if ((curCandle.c - prevCandle.c)>0){
      sumU += curCandle.c - prevCandle.c;
      countU++;
    }
    if ((curCandle.c - prevCandle.c)<0){
      sumD += prevCandle.c - curCandle.c;
      countD++;
    }    
  }
  let MA_U = sumU/countU;
  let MA_D = sumD/countD;

  if (countU > 0 && countD > 0){
    return fixFloat(100*MA_U/(MA_U+MA_D));
  }

  if (countU == 0 && countD > 0){
    return 0;
  }

  if (countU >  0 && countD == 0){
    return 100;
  }

  if (countU == 0 && countD == 0){
    return 50;
  } 
}

function calc_stohastic(candles, currentPrice, opt){
  let min = calc_min(candles);
  let max = calc_max(candles);
  return fixFloat((currentPrice - min) / (max - min) * 100);
}


function fixFloat(c){
    return parseFloat(parseFloat(c).toFixed(2));
}

function log(){

}