const termkit         = require('terminal-kit');

term = termkit.terminal ;
term.options.crlf = true ;
term.clear() ;
var document = term.createDocument() ;

cl = console.log;

(async function init(){

  var text = new termkit.Text( {
    parent: document ,
    content: "BestBot v.9000" ,
    attr: {
      color: 'brightMagenta' ,
      bold: true ,
      italic: true
    }
  } ) ;

  // Общая структура внешнего вида консольного приложения
  var layout = new termkit.Layout( {
    parent: document ,
    boxChars: 'double' ,
    layout: {
      id: 'parent' ,
      y: 2 ,
      widthPercent: 100 ,
      heightPercent: 90 ,
      rows: [
        {
          id: '1st row' ,
          heightPercent: 100 ,
          columns: [
            { id: 'mainWindow' ,
              rows:[
                { id: 'main' , heightPercent: 70} ,
                { id: 'services' }
              ]} ,
            { 
              id: 'instrument' , 
              widthPercent: 30,  
              rows:[
                { id: 'balance', widthPercent: 100, heightPercent: 20 } ,
                { id: 'orders', widthPercent: 100, heightPercent: 15 } ,
                { id: 'candles', widthPercent: 100, heightPercent: 30 } ,
                { id: 'orderbook' , widthPercent: 100,
                columns: [
                  { id: 'bids' } ,
                  { id: 'asks' } ,
                ] } ,
              ]
            } ,
          ]
        }
      ]
    }
  } ) ;


  logTextBox = new termkit.TextBox( {
    parent: document.elements['main'] ,
    content: '',
    contentHasMarkup: true ,
    scrollable: true ,
    vScrollBar: true ,
    wordWrap: true ,
    width: document.elements['main'].inputWidth ,
    height: document.elements['main'].inputHeight
  } ) ;

  //Подмена стандартного метода вывода
  console.log = function (data){
    if (typeof data == 'object'){
      data = JSON.stringify(data);
    }
    logTextBox.appendLog(data);
  }

  logTextBox2 = new termkit.TextBox( {
    parent: document.elements['services'] ,
    content: '',
    contentHasMarkup: true ,
    scrollable: true ,
    vScrollBar: true ,
    wordWrap: true ,
    width: document.elements['services'].inputWidth ,
    height: document.elements['services'].inputHeight
  } ) ;

  term.hideCursor() ;

  term.on( 'key' , function( key ) {
    if ( key === 'CTRL_C' ) {
      term.grabInput( false ) ;
      term.hideCursor( false ) ;
      term.moveTo( 1 , term.height )( '\n' ) ;
      process.exit() ;
    }
  } ) ;
})();

//Очищаем экран
module.exports.clear = function(){
  document.elements['main'].clear();

  logTextBox = new termkit.TextBox( {
    parent: document.elements['main'] ,
    content: '',
    contentHasMarkup: true ,
    scrollable: true ,
    vScrollBar: true ,
    wordWrap: true ,
    width: document.elements['main'].inputWidth ,
    height: document.elements['main'].inputHeight
  } ) ;

}

//Вывод текст в окно лога
module.exports.log = function(msg){
  if (typeof msg == 'object'){
    msg = JSON.stringify(msg);
  }
  logTextBox2.appendLog(msg);
}

//Заменяем текст в блоке
module.exports.render = function(el, msg){
  document.elements[el].clear();
  if (typeof msg == 'object'){
    msg = JSON.stringify(msg);
  }

  new termkit.TextBox( {
    parent: document.elements[el] ,
    content: msg,
    width: 100,
    height:100,
    lineWrap: true ,
    wordWrap: true ,  
    vScrollBar: true ,

  } ) ;
}

//Выводим общую информацию по текущему статусу работы робота
module.exports.renderStatus = function (){
  //balances
  if (balance[options.instrument] != undefined){
    var b = balance[options.instrument];
  }else{
    var b = {};
  }

  var data = [
    ['Тип', b?.instrument_type??0],
    ['Инструмент' , instruments?.[options.instrument]?.name??'Неизвестно'],
    ['Баланс' , b?.quantity??0],
    ['Лотов'  , b?.quantity_lots??0],
    ['Средняя цена', b?.average_position_price??NaN],
    ['Средняя цена (FIFO)', b?.average_position_price_fifo??NaN],
    ['Текущая цена', b?.current_price??NaN],
  ];

  module.exports.render('balance', tablify(data));
  web.render('balance', html(data));

  //orders
  if (orders['ORDER_DIRECTION_BUY'][options.instrument] != undefined){
    var b = orders['ORDER_DIRECTION_BUY'][options.instrument];
  }else{
    var b = {};
  }

  if (orders['ORDER_DIRECTION_SELL'][options.instrument] != undefined){
    var s = orders['ORDER_DIRECTION_SELL'][options.instrument];
  }else{
    var s = {};
  }

  var data = [
    ['Тип', 'ИД', 'Кол', 'Вып', 'Цена'],
    ['Покупка', b?.order_id, b?.lots_requested, b?.lots_executed, b?.initial_order_price, ],
    ['Продажа', s?.order_id, s?.lots_requested, s?.lots_executed, s?.initial_order_price, ],
  ];

  
  module.exports.render('orders', tablify(data));
  web.render('orders', html(data));
}