import http from 'http'
import { configuredHandleUpgrade, handleUpgrade } from './server';

const server = http.createServer((req, res) =>
{
    res.end('Hello World');
});

const configFile = process.argv[3] || '../config.json';

server.on('upgrade', handleUpgrade('proxy', configuredHandleUpgrade(require(configFile))));

server.listen(process.argv[2])
