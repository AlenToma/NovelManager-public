import sqlite from 'sqlite3'
import ServiceProp from './ServiceProps';
const sqlite3 = sqlite.verbose();
type Query = {
    sql: string;
    args: unknown[];
}
export default class Database {
    name?: string;
    path?: string;
    db: sqlite.Database;
    closed: boolean;
    serviceProp: ServiceProp;
    constructor(name?: string, path?: string) {
        this.name = name;
        this.path = path;
        this.closed = true;
        this.db = undefined;
        this.serviceProp = new ServiceProp(name, path).save();
    }

    promise(func: (resolve: (data, error?: any) => void) => void | Promise<void>) {
        return (new Promise((resolve, reject) => {
            func((data: any, error: any) => {
                if (error) {
                    console.error(error);
                    reject(error);
                }
                else resolve(data);
            });
        }))
    }

    async exec(query: Query[]) {
        return this.promise((resolve) => {
            this.open().serialize(async () => {
                try {
                    let errors = undefined;
                    console.info("exec", query)
                    const promises = query.map(x => this.promise((sResolve) => {
                        this.db.run(x.sql, x.args, function (error) {
                            errors = error;
                            sResolve(true, error)
                        });
                    }))
                    await Promise.all(promises);
                    resolve(true, errors);

                } catch (e) {
                    resolve(true, e)
                }
            });
        })
    }


    async executeSql(sql, query) {
        return this.promise((resolve) => {
            this.open().serialize(() => {
                try {
                    console.info("executeSql", sql, query)
                    this.db.run(sql, query, (error) => {
                        resolve(true, error);
                    });

                } catch (e) {
                    resolve(true, e);
                }
            });
        })
    }

    async select(sql, query) {
        return this.promise((resolve) => {
            this.open().serialize(() => {
                const data = [];
                let error = undefined;
                console.info("select", sql, query)
                try {
                    this.db.each(sql, query, (err, row) => {
                        if (err) {
                            error = err;
                            return;
                        }
                        data.push(row)
                    }, () => {
                        resolve(data, error);

                    });

                } catch (e) {
                    resolve(data, error);
                }
            });
        })
    }

    close() {
        this.closed = true;
        if (this.db)
            this.db.close();
    }

    open() {
        try {

            if ((!this.name || !this.path) && this.serviceProp.name) {
                if (this.serviceProp.name)
                    this.name = this.serviceProp.name;
                if (this.serviceProp.path)
                    this.path = this.serviceProp.path;
            }

            if (!this.db || this.closed)
                this.db = new sqlite3.Database(`${this.path}${this.name}`);
            this.closed = false;
            return this.db;
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }
}
