import { Proxy } from "http-mitm-proxy";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const proxy = new Proxy();

// Open a database connection
const dbPromise = open({
    filename: 'requests.db',
    driver: sqlite3.Database
});
// Create a table to store requests
dbPromise.then(db => {
    db.run('CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY, method TEXT, url TEXT, headers TEXT, body TEXT)');
}).catch(err => {
    console.error('Error opening database:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

proxy.onError(function (ctx, err) {
    console.error('proxy error:', err);
});

proxy.onRequest(function (ctx, callback) {
    const url = ctx.clientToProxyRequest.url;
    const method = ctx.clientToProxyRequest.method;
    const requestFilePath = path.join(__dirname, 'requests.txt');
    const requestData = `Request: ${method} ${url}\nHeaders: ${JSON.stringify(ctx.clientToProxyRequest.headers)}\nBody: ${ctx.clientToProxyRequest.body}\n\n`;
    console.log('request:', { url, method });
    console.log('headers:', ctx.clientToProxyRequest.headers);
    console.log('body:', ctx.clientToProxyRequest.body);
    
    fs.appendFile(requestFilePath, requestData, (err) => {
        if (err) {
            console.error('Error writing request to file:', err);
        } else {
            console.log('Request written to file:', requestFilePath);
        }
    });
    // write request to database
    dbPromise.then(db => {
        const headers = JSON.stringify(ctx.clientToProxyRequest.headers);
        const body = ctx.clientToProxyRequest.body ? ctx.clientToProxyRequest.body.toString() : '';
        db.run('INSERT INTO requests (method, url, headers, body) VALUES (?, ?, ?, ?)', [method, url, headers, body])
            .then(() => {
                console.log('Request saved to database');
            })
            .catch(err => {
                console.error('Error saving request to database:', err);
            });
    });

    return callback();
});


proxy.onResponse(function (ctx, callback) {
    const url = ctx.clientToProxyRequest.url;
    const method = ctx.clientToProxyRequest.method;
    const responseHeaders = ctx.serverToProxyResponse.headers;

    console.log('response:', { url, method });
    console.log('response headers:', responseHeaders);
    console.log('+------------+')
    return callback();
});


console.log('begin listening on 8081')
proxy.listen({ port: 8081 });