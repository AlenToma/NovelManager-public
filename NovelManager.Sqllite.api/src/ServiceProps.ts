import fs from 'fs';
class ServiceProp {
    name?: string;
    path?: string;
    params?: string;
    constructor(name?: string, path?: string) {
        this.name = name;
        this.path = path;
        if (!this.name || !this.path)
              this.start();
    }

    start() {
        const settingsFilePath = "./configs/settings.json";
        if (fs.existsSync(settingsFilePath)) {
            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
            Object.keys(settings).forEach(x => this[x] = settings[x]);
        }
    }

    save() {
        if (!this.name || !this.path)
            return this;
        const settingsFilePath = "./configs/settings.json";
        fs.writeFileSync(settingsFilePath, JSON.stringify(this), 'utf8');
        return this;
    }
}

export default ServiceProp;