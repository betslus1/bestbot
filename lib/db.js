const { PromisedDatabase } = require("promised-sqlite3"); // import the class

const sqlite3 = new PromisedDatabase(); // create a instance of PromisedDatabase
// note: at this stade, the wrapped sqlite3.Database object is not created.

var isReady = false;
var sqlQueue = [];

module.exports.con = false;

//Подключаемся к БД/ создаем структуру. Для очистки БД достаточно удалить файл БД
module.exports.init = async function() {
    try {
        await sqlite3.open("./data/db.sqlite"); // create a sqlite3.Database object & open the database on the passed filepath.

        // run some sql request.
        await sqlite3.run(`CREATE TABLE IF NOT EXISTS "log" (
            "id"    INTEGER,
            "module"    TEXT,
            "time"  INTEGER,
            "type"  TEXT,
            "desc"  TEXT,
            PRIMARY KEY("id" AUTOINCREMENT)
        )`); 

        await sqlite3.run(`CREATE TABLE IF NOT EXISTS "trade" (
            "id"    TEXT,
            "n" INTEGER,
            "figi"  TEXT,
            "operationType" TEXT,
            "date"  INTEGER,
            "instrumentType"    TEXT,
            "currency"  TEXT,
            "price" REAL,
            "pair"  TEXT,
            "pair_n"    INTEGER,

            PRIMARY KEY("id","n")
        )`); 

        await sqlite3.run(`CREATE TABLE IF NOT EXISTS "operations" (
            "id"    INTEGER,
            "figi"  TEXT,
            "date"  INTEGER,
            "profit"    REAL,
            "comission" REAL,
            "buy"   INTEGER UNIQUE,
            "sell"  TEXT UNIQUE,
            "currency"  TEXT,
            "profit_RUB"    REAL,
            "type"  TEXT,
            PRIMARY KEY("id" AUTOINCREMENT)
        )`); 

        

        module.exports.con = sqlite3.db;
        isReady = true;
    } catch(err) {
        term.clear();
        cl(err);
        process.exit();
    }
}

//Для гарантии порядка запросов и исключения RC, очередь запросов 
module.exports.query = function(sql, params) {
    sqlQueue.push({sql,params});
}

setInterval(function(){
    if (isReady == false || sqlQueue.length == 0){
        return;
    }
    var {sql, params} = sqlQueue.shift();
    try {
        const stmt = module.exports.con.prepare(sql);
        stmt.run(params);
        stmt.finalize();
    }catch(err){
        die(err);
    }
})

//SELECT запросы
module.exports.select = function (sql) {
    if (isReady == false){
        return;
    }
    return new Promise((resolve, reject) => {
        const queries = [];
            module.exports.con.each(sql, (err, row) => {
            if (err) {
                reject(err); // optional: you might choose to swallow errors.
            } else {
                queries.push(row); // accumulate the data
            }
        }, (err, n) => {
            if (err) {
                reject(err); // optional: again, you might choose to swallow this error.
            } else {
                resolve(queries); // resolve the promise
            }
        });
    });
}
