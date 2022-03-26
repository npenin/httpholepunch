import http from 'http'
import { configuredHandleUpgrade, handleUpgrade } from './server';

const server = http.createServer((req, res) =>
{
    res.end('Hello World');
});

const configFile = process.argv[2] || '../config.json';

server.on('upgrade', handleUpgrade('proxy', configuredHandleUpgrade(require(configFile))));

server.listen(8080)
