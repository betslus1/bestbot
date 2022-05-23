//Подключение алертинга телеграмм
try{
    if (options.telegramKey != ''){
        const TelegramBot = require('node-telegram-bot-api');
        telegram     = new TelegramBot(options.telegramKey, {polling: true});

        telegram.onText(/\/start/, (msg, match) => {
            const chatId = msg?.chat?.id;
            telegram.sendMessage(chatId, "Ваш chatId для указания в настройках: " + chatId);
        });

        if (options.chatId > 0){
            telegram.sendMessage(options.chatId, 'bestbot started');
        }
    }
}catch(err){
    log('logger', new String(err), 'error');
}

//Общий метод логирования, параметры модуль/функция, сообщение, тип, отображать ли в общем логе, отправить сообщение в телеграмм
log = function (func, msg, type, isShow, isAlert){
    db.query("INSERT INTO log (id, module, time, type, desc) VALUES (?, ?, ?, ?, ?)", [null, func, new Date(), type, msg]);

    if (type == 'debug'){
        return;
    }
    if (msg != undefined && typeof msg === 'object'){
        msg = JSON.stringify(msg);
    }

    if (isShow != false){
        consoleUI.log(`${moment().format()} [${func}] : ${msg}`);
        web.log(`${moment().format()} [${func}] : ${msg}`);
    }

    if (type == 'error'){
        errorsCount++;
    }
    
    if (type == 'error' && telegram != undefined || isAlert == true){
        telegram.sendMessage(options.chatId, `[${func}] : ${msg}`);
    }

}

//Выводим на экран и выключаем приложение
die = function (msg){
    term.clear();
    cl(msg);
    process.exit();
}