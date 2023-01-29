import fs from 'fs';
export default class Params{
    constructor(args: string[], ...keys: string[]){
        this.start();
        args.forEach(x=> {
            keys.forEach(k=> {
                if (x.indexOf(k+"=")!= -1){
                    const sText = x.split("=");
                    this[sText[0]] = sText[1].replace(/\'|\"/g, "");
                }
            })
        })
        this.save();
     
    }

    start() {
        const settingsFilePath = "./configs/paramsSettings.json";
        if (fs.existsSync(settingsFilePath)) {
            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
            Object.keys(settings).forEach(x => this[x] = settings[x]);
        }
    }

    save() {
        const settingsFilePath = "./configs/paramsSettings.json";
        fs.writeFileSync(settingsFilePath, JSON.stringify(this), 'utf8');
        return this;
    }
}

