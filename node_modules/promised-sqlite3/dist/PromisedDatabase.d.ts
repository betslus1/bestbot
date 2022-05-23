import sqlite3 from 'sqlite3';
export declare class PromisedDatabase {
    /** @private */
    private _db;
    constructor();
    /**
     * @returns The wrapped sqlite3.Database object.
     */
    get db(): sqlite3.Database | undefined;
    /**
     * Instantiate the wrapped sqlite3.Database and open the database.
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#new-sqlite3databasefilename-mode-callback | sqlite3.Database.open} for further information.
     * @param filename - filename used to instantiate sqlite3.Database.
     * @param mode - mode used to instantiate sqlite3.Database.
     */
    open(filename: string, mode?: number): Promise<void>;
    /**
     * Close the database.
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaseclosecallback | sqlite3.Database.close} for further information.
     */
    close(): Promise<void>;
    /**
     * Execute a sql request.<br>
     * Used for request that return nothing (eg `INSERT INTO`, `CREATE TABLE`)
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback | sqlite3.Database.run} for further information.
     * @param sql - The sql request.
     * @param params - Parameters for the request.
     */
    run(sql: string, ...params: any[]): Promise<sqlite3.RunResult>;
    /**
     * Execute a sql request.<br>
     * Used for request that return data. (eg `SELECT`).<br>
     * Return only the first row that match the request.
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databasegetsql-param--callback | sqlite3.Database.get} for further information.
     * @param sql - The sql request.
     * @param params - Parameters for the request.
     */
    get(sql: string, ...params: any[]): Promise<any>;
    /**
     * Execute a sql request.<br>
     * Used for request that return data. (eg `SELECT`).<br>
     * Return all rows that match the request in a array.
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaseallsql-param--callback | sqlite3.Database.all} for further information.
     * @param sql - The sql request.
     * @param params - Parameters for the request.
     */
    all(sql: string, ...params: any[]): Promise<any[]>;
    /**
     * Execute a sql request.<br>
     * Used for request that return data. (eg `SELECT`).<br>
     * Execute the callback `cb` for each row.<br>
     * Return the number of retrieved rows.<br>
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaseeachsql-param--callback-complete | sqlite3.Database.each} for further information.
     * @param sql - The sql request.
     * @param params - Parameters for the request.
     * @param cb - A callback that take a row.
     */
    each(sql: string, params: any, cb: (row: any) => void): Promise<number>;
    /**
     * Runs all sql queries in sql argument.
     * @see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaseexecsql-callback | sqlite3.Database.exec} for further information.
     * @param sql - sql request.
     */
    exec(sql: string): Promise<void>;
    /**
     * Add a table to the database.<br>
     * Shortcut for `CREATE TABLE [IF NOT EXISTS] tableName (...)`.
     * @category Shortcut
     * @param tableName - name of the table to create.
     * @param ifNotExists - if set to true, add `IF NOT EXISTS` clause to the request.
     * @param cols - column definitions.
     */
    createTable(tableName: string, ifNotExists: boolean, ...cols: string[]): Promise<sqlite3.RunResult>;
    /**
     * Delete a table from the database.<br>
     * Shortcut for `DROP TABLE [IF EXISTS] tableName`.
     * @category Shortcut
     * @param tableName - name of the table.
     * @param ifExists - if set to true, add `IF EXISTS` clause to the request.
     */
    dropTable(tableName: string, ifExists?: boolean): Promise<sqlite3.RunResult>;
    /**
     * Insert `row`in table.<br>
     * Shortcut for `INSERT INTO tableName [(...)] VALUES (...)`.<br>
     * `row`'s keys are used for table columns in the request. (Map or Object).<br>
     * if `row` is an Array, column names are omitted in the request.
     *
     * Exemple:
     * ```typescript
     * // table foo
     * // id INTEGER PRIMARY KEY AUTOINCREMENT
     * // name TEXT
     * // age INTEGER
     *
     * await db.insert("foo", { name: "Alice", age: 20 });
     * await db.insert("foo", [50, "Bob", 32]); // Array => column names are omitted so all values must be given.
     *
     * const m = new Map().set("name", "Conan").set("age", 53);
     * await db.insert("foo", m);
     * ```
     *
     * @category Shortcut
     * @param tableName - name of table.
     * @param row - row to insert.
     */
    insert(tableName: string, row: any): Promise<sqlite3.RunResult>;
    /**
     * Replace or insert `row` in the table.<br>
     * Shortcut for `REPLACE INTO tableName [(...)] VALUES (...)`.
     * @see `insert` for parameters usage and exemple
     * @category Shortcut
     * @param tableName - name of table.
     * @param row - row to insert.
     */
    replace(tableName: string, row: any): Promise<sqlite3.RunResult>;
    /**
     * Insert multiple rows in table.<br>
     * Shortcut for `REPLACE INTO tableName [(...)] VALUES (...),(...),...`.<br>
     * If `columnName` if `undefined` or empty, column names are omitted in the request.<br>
     * If `columnName` is defined, `culumnName`'s values are used as keys to get values from each row.<br>
     * Except if the row is an Array.<br>
     * **Warning**: if `columnName` is `undefined` or empty, use only Array in `rows`. With Object or Map, values order is not guaranteed.
     *
     * Exemple:
     * ```typescript
     * // table foo
     * // id INTEGER PRIMARY KEY AUTOINCREMENT
     * // name TEXT
     * // age INTEGER
     *
     * const a = {name: "Alice", age: 20 };
     * const b = ["Bob", 32];
     * const c = new Map().set("name", "Conan").set("age", 53);
     * await db.insertMany("foo", ["name", "age"], a, b, c);
     * ```
     * @category Shortcut
     * @param tableName - name of table.
     * @param columnNames - column names.
     * @param rows - rows to insert.
     */
    insertMany(tableName: string, columnNames: string[] | undefined | null, ...rows: any[]): Promise<sqlite3.RunResult>;
    /**
     * Return true if there is a row that match the `whereClause` in the table `tableName`.
     * Return false otherwise.
     *
     * Exemple:
     * ```typescript
     * // table foo
     * // id INTEGER PRIMARY KEY AUTOINCREMENT
     * // name TEXT
     * // age INTEGER
     *
     * await db.insert("foo", { name: "Alice", age: 20 });
     *
     * console.log(await db.exists("foo", "name = ?", "Alice")); // true
     * console.log(await db.exists("foo", "name = ? AND age < ?", "Alice", 30)); // true
     * console.log(await db.exists("foo", "age > ?", 30)); // false
     *
     * ```
     * @category Shortcut
     * @param tableName - Name of table.
     * @param whereClause - A sqlite where clause.
     * @param params - Parameters for the request.
     */
    exists(tableName: string, whereClause: string, ...params: any[]): Promise<boolean>;
}
