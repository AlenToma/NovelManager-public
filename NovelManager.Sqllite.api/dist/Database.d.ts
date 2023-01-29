import sqlite from 'sqlite3';
import ServiceProp from './ServiceProps';
type Query = {
    sql: string;
    args: unknown[];
};
export default class Database {
    name?: string;
    path?: string;
    db: sqlite.Database;
    closed: boolean;
    serviceProp: ServiceProp;
    constructor(name?: string, path?: string);
    promise(func: (resolve: (data: any, error?: any) => void) => void | Promise<void>): Promise<unknown>;
    exec(query: Query[]): Promise<unknown>;
    executeSql(sql: any, query: any): Promise<unknown>;
    select(sql: any, query: any): Promise<unknown>;
    close(): void;
    open(): sqlite.Database;
}
export {};
