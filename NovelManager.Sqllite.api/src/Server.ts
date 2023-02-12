import express from 'express'
import Database from './Database'
import { argv } from 'node:process'
import FileUpload from 'express-fileupload'
import Params from './Params'
import Path from 'path'
import Https from 'https'
import fs from 'fs'
import cors from 'cors'

const app = express();
const params = new Params(argv, "path", "port", "host") as any;
let db = new Database(undefined, params.path);
app.use(cors());
app.use(express.json());
app.use(FileUpload());

const addCore = (res, isHtml) => {

    res.set("Access-Control-Allow-Origin", "*");
    res.set('Access-Control-Allow-Methods', '*');
    res.set("Access-Control-Allow-Headers", "*");
    if (!isHtml)
        res.set('Content-Type', 'application/json');
    else res.set('Content-Type', 'text/html; charset=UTF-8');
}

const open = (dbName: string) => {
    try {
        if (db && db.name === dbName)
            return true;
        console.info(dbName, params.path)
        db = new Database(dbName, db.serviceProp.path || params.path);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

app.get('/ping', (req, res) => {
    addCore(res, true);
    const query = req.query as any;
    res.status(200).send('pong-' + query.name);
});

app.get("/open", (req, res) => {
    const query = req.query as any;
    if (open(query.name))
        res.send('Ok');
    else res.send("NO");
});

app.get("/close", (req, res) => {
    if (db)
        db.close();
    res.send("OK");
});

app.post("/exec", (req, res) => {
    const body = req.body;
    const query = req.query as any;
    db.exec(body as []).then(x => res.send(x)).catch(x => res.status(500).send(x));
});

app.post("/executeSql", (req, res) => {
    const body = req.body;
    const query = req.query as any;
    db.executeSql(body.sql, body.args).then(x => res.send("OK")).catch(x => res.status(500).send(x));
});

app.post("/select", (req, res) => {
    const body = req.body;
    const query = req.query as any;
    db.select(body.sql, body.args).then(x => res.json(x)).catch(x => res.status(500).send(x));
});

app.get("/download", function (req, res) {
    const options = {
        root: params.path
    };

    const fileName = db.name || db.serviceProp.name;
    console.info(options, fileName)
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Sent:', fileName);
        }
    });
});

app.post('/upload', function (req, res) {

    if (!req.files || Object.keys(req.files).length === 0) {
        console.error(req.files)
        res.status(400).send('No files were uploaded.');
        return;
    }
    db.close();
    const database = req.files.file as FileUpload.UploadedFile;

    const uploadPath = params.path + database.name;

    database.mv(uploadPath, function (err) {
        if (err) {
            return res.status(500).send(err);
        }

        res.status(200).send('File uploaded to ' + uploadPath);
    });
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = params.port || process.env.PORT || 8181;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`, params);
});

