import http from 'http'
import net from 'net'

const server = net.createServer();

const req = http.request(process.argv[2], { headers: { connection: 'upgrade', upgrade: 'proxy', } }).on('upgrade', function (res)
{
    try
    {
        if (res.statusCode == 101)
        {
            server.on('connection', (socket) =>
            {
                console.log('connection received');
                socket.pipe(res.socket);
                res.socket.pipe(socket);
            });
        }
        else
            console.log(res);
    } catch (e)
    {
        console.error(e);
    }
});

server.listen(process.argv[3], () =>
    console.log(`listening on ${process.argv[3]}`));
req.flushHeaders();
