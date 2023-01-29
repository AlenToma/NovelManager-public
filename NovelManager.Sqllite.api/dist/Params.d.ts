export default class Params {
    constructor(args: string[], ...keys: string[]);
    getPath(): string;
    start(): void;
    save(): this;
}
