//Модуль игры для конкурса, в роботе не используется
module.exports = function (){
	this.figi 		= false;
	this.maxPipes   = 5
	this.orderbooks = [];

	this.orderbook = function(ob){

		this.orderbooks.push(ob);

		if (this.orderbooks.length > this.maxPipes){
	    	this.orderbooks.splice(0,1);
	    }

	    let bids      = [];
	    let time     = [];
	    let asks      = [];

	    for (let ob of this.orderbooks){
	    	time.push(moment(ob.time).format('HH:mm:ss'));
	    	bids.push(ob.bids);
	    	asks.push(ob.asks);
	    }
	    web.game_ob(time, bids, asks);
	}

	return this;
}

