"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const ServiceProps_1 = __importDefault(require("./ServiceProps"));
const sqlite3 = sqlite3_1.default.verbose();
class Database {
    constructor(name, path) {
        this.name = name;
        this.path = path;
        this.closed = true;
        this.db = undefined;
        this.serviceProp = new ServiceProps_1.default(name, path).save();
    }
    promise(func) {
        return (new Promise((resolve, reject) => {
            func((data, error) => {
                if (error) {
                    console.error(error);
                    reject(error);
                }
                else
                    resolve(data);
            });
        }));
    }
    async exec(query) {
        return this.promise((resolve) => {
            this.open().serialize(async () => {
                try {
                    let errors = undefined;
                    const promises = query.map(x => this.promise((sResolve) => {
                        this.db.run(x.sql, x.args, function (error) {
                            errors = error;
                            sResolve(true, error);
                        });
                    }));
                    await Promise.all(promises);
                    resolve(true, errors);
                }
                catch (e) {
                    resolve(true, e);
                }
            });
        });
    }
    async executeSql(sql, query) {
        return this.promise((resolve) => {
            this.open().serialize(() => {
                try {
                    console.info("executeSql", sql, query);
                    this.db.run(sql, query, (error) => {
                        resolve(true, error);
                    });
                }
                catch (e) {
                    resolve(true, e);
                }
            });
        });
    }
    async select(sql, query) {
        return this.promise((resolve) => {
            this.open().serialize(() => {
                const data = [];
                let error = undefined;
                console.info("select", sql, query);
                try {
                    this.db.each(sql, query, (err, row) => {
                        if (err) {
                            error = err;
                            return;
                        }
                        data.push(row);
                    }, () => {
                        resolve(data, error);
                    });
                }
                catch (e) {
                    resolve(data, error);
                }
            });
        });
    }
    close() {
        this.closed = true;
        if (this.db)
            this.db.close();
    }
    open() {
        try {
            if ((!this.name || !this.path) && this.serviceProp.name) {
                this.name = this.serviceProp.name;
                this.path = this.serviceProp.path;
            }
            if (!this.db || this.closed)
                this.db = new sqlite3.Database(`${this.path}${this.name}`);
            this.closed = false;
            return this.db;
        }
        catch (e) {
            console.error(e);
            return undefined;
        }
    }
}
exports.default = Database;
//# sourceMappingURL=Database.js.map