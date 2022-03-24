import http from 'http'
import net from 'net'

const server = http.createServer((req, res) =>
{
    res.end('Hello World');
});

const configFile = process.argv[2] || '../config.json';

server.on('upgrade', async (req, socket: net.Socket, head) =>
{
    const config = await import(configFile);
    if (req.headers.upgrade === 'proxy' && req.url && req.url in config)
    {
        console.log('upgrading from ' + req.url)
        const remote = net.connect(config[req.url as keyof typeof config], () =>
        {
            socket.setNoDelay(true);
            socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                'Upgrade: proxy\r\n' +
                'Connection: Upgrade\r\n' +
                '\r\n', function (e)
            {
                if (e)
                    console.error(e);
                else
                {
                    console.log('upgraded ');
                    socket.pipe(remote);
                    remote.pipe(socket);
                }
            });

            socket.on('error', function (e)
            {
                console.error(e);
            })
            remote.on('error', function (e)
            {
                console.error(e);
            })
        });
    }
});

server.listen(8080)