module.exports = {
	'login' 	   : 'demo', //имя от веб версии
	'password' 	   : 'demo', //пароль от веб версии
	'appname'      : 'bestbot', //Служебный параметр для идентификации SDK на стороне брокера (для статистики), желательно не менять если используете стандартную конфигурацию
	'workmode'     : 'sandbox', //real, sandbox, backtest
	'port'         : 333,//Номер порта для веб версии интерфейса
	'token'        : false || process.argv[2], //Токен либо первый аргумент "node app.js <token>"
	'tradeAccount' : 2163287424, //Номер счета, посмотреть можно в брокреском отчете или методом getAccounts()
	'sandboxAccountId' : 'c2165d7a-e784-4bf8-9632-9caf0423fc9a', //account_id для песочницы по умолчанию
	'strategy'     : 'rsi',//Имя стратегии по умолчанию
	'instrument'   : 'BBG004S68598', //'BBG000B9XRY4', //Figi инструмента по умолчанию
	'candleHistoryLenght': 60,	//Количество свечей передаваемых в стратегию
	'isLog'        :	{ //Отображать или скрывать в общем логе данные типы сообщений
		'ordersSync'      : false,
		'balanceSync'	  : false,
		'loadInstruments' : true,
		'loadHistory'     : true,
		'operationsSync'  : true,
	},
	'comission'    : 0.025/100, //Размер комиссии брокера
	'telegramKey'  : '5390000718:AAHBQvYsH6SX5-icva_Q3HTtQuhU4oiQwP0', //Создается через бота @botFather в телеграм
	'chatId'	   : 129531676, //смотрим через бота (отправить боту в телеграме /start и запустить приложение, потом вписать сюда ID вашего чата),
	'maxCountError': 100, //Количество ошибок в час для автоматической аварийной остановки
	'minMoneyBalance' : -10000,
	'limit'       : { //rpm
		'marketData' : 30,
		'orders'     : 30,
		'operations' : 30,
	}
}