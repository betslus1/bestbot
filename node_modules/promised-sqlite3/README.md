# promised-sqlite3
A wrapper for sqlite3 node.js package to use Promise.

[![NPM version](https://badge.fury.io/js/promised-sqlite3.svg)](https://www.npmjs.com/package/promised-sqlite3)

## Motivation
<a href="https://www.npmjs.com/package/sqlite3">sqlite3</a> is a callback-based SQLite3 binding for Node.js.  
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">Promise</a> is a cool javascript feature.

The goal of promised-sqlite3 is to provide a wrapper arround sqlite3 to provide Promise-friendly methods.

## Install
```
npm install promised-sqlite3
```

## Usage
```javascript
const { PromisedDatabase } = require("promised-sqlite3"); // import the class

const db = new PromisedDatabase(); // create a instance of PromisedDatabase
// note: at this stade, the wrapped sqlite3.Database object is not created.

async function init() {
    try {
        await db.open("./db.sqlite"); // create a sqlite3.Database object & open the database on the passed filepath.

        // run some sql request.
        await db.run("CREATE TABLE IF NOT EXISTS foo (id INTEGER PRIMARY KEY AUTOINCREMENT, a TEXT NOT NULL, b TEXT)"); 
        await db.run("INSERT INTO foo (a, b) VALUES (?, ?)", "alpha", "beta");
        await db.run("INSERT INTO foo (a, b) VALUES ($goo, $hoo)", { $goo: "GOO !", $hoo: "HOO :" });
        await db.run("INSERT INTO foo (a, b) VALUES (?, ?)", ["Value of a", "Value of b"]);

        // read database
        const row = await db.get("SELECT * FROM foo WHERE id = ?", 2);
        console.log(row2);

        const rows = await db.all("SELECT * FROM foo");
        console.log(rows);

        await db.each("SELECT * FROM foo WHERE id > ?", 5,
            function(row) {
                console.log(row);
            }
        );

        // get the wrapped sqlite3.Database object
        const sqliteDB = db.db;

        // close the database
        await db.close();

    } catch(err) {
        console.error(err);
    }
}

init();
```
## Documentation
<a href="https://baanloh.github.io/promised-sqlite3/">Docs<a>
