declare class ServiceProp {
    name?: string;
    path?: string;
    params?: string;
    constructor(name?: string, path?: string);
    start(): void;
    save(): this;
}
export default ServiceProp;
