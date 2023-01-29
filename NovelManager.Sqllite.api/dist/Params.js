"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class Params {
    constructor(args, ...keys) {
        this.start();
        args.forEach(x => {
            keys.forEach(k => {
                if (x.indexOf(k + "=") != -1) {
                    const sText = x.split("=");
                    this[sText[0]] = sText[1].replace(/\'|\"/g, "");
                }
            });
        });
        this.save();
    }
    start() {
        const settingsFilePath = "./configs/paramsSettings.json";
        if (fs_1.default.existsSync(settingsFilePath)) {
            const settings = JSON.parse(fs_1.default.readFileSync(settingsFilePath, 'utf8'));
            Object.keys(settings).forEach(x => this[x] = settings[x]);
        }
    }
    save() {
        const settingsFilePath = "./configs/paramsSettings.json";
        fs_1.default.writeFileSync(settingsFilePath, JSON.stringify(this), 'utf8');
        return this;
    }
}
exports.default = Params;
//# sourceMappingURL=Params.js.map