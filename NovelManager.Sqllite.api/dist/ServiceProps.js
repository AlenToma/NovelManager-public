"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class ServiceProp {
    constructor(name, path) {
        this.name = name;
        this.path = path;
        if (!this.name || !this.path)
            this.start();
    }
    start() {
        const settingsFilePath = "./configs/settings.json";
        if (fs_1.default.existsSync(settingsFilePath)) {
            const settings = JSON.parse(fs_1.default.readFileSync(settingsFilePath, 'utf8'));
            Object.keys(settings).forEach(x => this[x] = settings[x]);
        }
    }
    save() {
        if (!this.name || !this.path)
            return this;
        const settingsFilePath = "./configs/settings.json";
        fs_1.default.writeFileSync(settingsFilePath, JSON.stringify(this), 'utf8');
        return this;
    }
}
exports.default = ServiceProp;
//# sourceMappingURL=ServiceProps.js.map