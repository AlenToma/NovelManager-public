"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Database_1 = __importDefault(require("./Database"));
const node_process_1 = require("node:process");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const Params_1 = __importDefault(require("./Params"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const params = new Params_1.default(node_process_1.argv, "path", "port", "host");
let db = new Database_1.default(undefined, params.path);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, express_fileupload_1.default)());
const addCore = (res, isHtml) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set('Access-Control-Allow-Methods', '*');
    res.set("Access-Control-Allow-Headers", "*");
    if (!isHtml)
        res.set('Content-Type', 'application/json');
    else
        res.set('Content-Type', 'text/html; charset=UTF-8');
};
const open = (dbName) => {
    try {
        if (db && db.name === dbName)
            return true;
        console.info(dbName, params.path);
        db = new Database_1.default(dbName, db.serviceProp.path || params.path);
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
};
app.get('/ping', (req, res) => {
    addCore(res, true);
    const query = req.query;
    res.status(200).send('pong-' + query.name);
});
app.get("/open", (req, res) => {
    const query = req.query;
    if (open(query.name))
        res.send('Ok');
    else
        res.send("NO");
});
app.get("/close", (req, res) => {
    if (db)
        db.close();
    res.send("OK");
});
app.post("/exec", (req, res) => {
    const body = req.body;
    const query = req.query;
    db.exec(body).then(x => res.send(x)).catch(x => res.status(500).send(x));
});
app.post("/executeSql", (req, res) => {
    const body = req.body;
    const query = req.query;
    db.executeSql(body.sql, body.args).then(x => res.send("OK")).catch(x => res.status(500).send(x));
});
app.post("/select", (req, res) => {
    const body = req.body;
    const query = req.query;
    db.select(body.sql, body.args).then(x => res.json(x)).catch(x => res.status(500).send(x));
});
app.get("/download", function (req, res) {
    const options = {
        root: params.path
    };
    const fileName = db.name || db.serviceProp.name;
    console.info(options, fileName);
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('Sent:', fileName);
        }
    });
});
app.post('/upload', function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        console.error(req.files);
        res.status(400).send('No files were uploaded.');
        return;
    }
    const database = req.files.file;
    const uploadPath = params.path + database.name;
    database.mv(uploadPath, function (err) {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send('File uploaded to ' + uploadPath);
    });
});
const PORT = params.port || process.env.PORT || 8181;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`, params);
});
//# sourceMappingURL=Server.js.map