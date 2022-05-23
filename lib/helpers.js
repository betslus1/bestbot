//  Задержка
sleep = async function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Исправляем float / приводим цену к minPriceIncrement
fixPrice = function (price, minPriceIncrement){
    price = parseFloat(price);
  if (minPriceIncrement == undefined){
    minPriceIncrement = 0.01;
  }
  return parseFloat(parseFloat( (Math.round(price/minPriceIncrement)*minPriceIncrement) ).toFixed(5));
}