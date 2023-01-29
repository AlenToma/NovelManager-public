export default class Params {
    constructor(args: string[], ...keys: string[]);
    start(): void;
    save(): this;
}
