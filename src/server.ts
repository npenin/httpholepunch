import http from 'http'
import net from 'net'

export function handleUpgrade(upgradeMethod: string, handler: (req: http.IncomingMessage, socket: net.Socket) => Promise<net.Socket>)
{
    return async (req: http.IncomingMessage, socket: net.Socket) =>
    {
        if (req.headers.upgrade === upgradeMethod && req.url)
        {
            console.log('upgrading from ' + req.url)
            const remote = await handler(req, socket);
            socket.setNoDelay(true);
            socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                'Upgrade: ' + upgradeMethod + '\r\n' +
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
        }
    }
}

export function configuredHandleUpgrade(config: Record<string, net.NetConnectOpts>)
{
    return (req: http.IncomingMessage, socket: net.Socket): Promise<net.Socket> => 
    {
        if (!req.url || !(req.url in config))
        {
            socket.write('404 Not Found\r\nContent-Length: 0\r\n');
            return Promise.reject(new Error('no such URL'));
        }
        return new Promise<net.Socket>((resolve, reject) =>
        {
            var resolved = false;
            const remote = net.connect(config[req.url as keyof typeof config], () =>
            {
                resolved = true;
                resolve(remote);
            });

            remote.on('error', (e) =>
            {
                if (!resolved)
                    reject(e);
            })
        });

    }
}