import net from 'net'
import readline from 'readline';
import stream from 'stream';
import http from 'http';
import { punch } from './client';



function question(question: string, options: { hidden?: boolean } = {})
{
    return new Promise<string>((resolve, reject) =>
    {
        const input = process.stdin;
        const output = process.stdout;

        type Rl = readline.Interface & { history: string[] };
        const rl = readline.createInterface({ input, output }) as Rl;

        if (options.hidden)
        {
            const onDataHandler = (charBuff: Buffer) =>
            {
                const char = charBuff + '';
                switch (char)
                {
                    case '\n':
                    case '\r':
                    case '\u0004':
                        input.removeListener('data', onDataHandler);
                        break;
                    default:
                        output.clearLine(0);
                        readline.cursorTo(output, 0);
                        output.write(question);
                        break;
                }
            };
            input.on('data', onDataHandler);
        }

        rl.question(question, (answer) =>
        {
            if (options.hidden) rl.history = rl.history.slice(1);
            rl.close();
            resolve(answer);
        });
    });
}

function upgrade(url: string, credentials?: { user: string, password: string })
{
    punch(url, 'proxy', credentials).then(httpsocket =>
    {
        console.log('waiting for connection...')
        server.on('connection', (socket) =>
        {
            console.log('connection received');
            socket.pipe(httpsocket, { end: true });
            httpsocket.pipe(socket, { end: true });
            httpsocket.on('end', function ()
            {

                console.log('http socket ended. Stopping...')
                server.close((e) =>
                {
                    if (e)
                        console.error(e);
                    else
                        console.log('Stopped')
                });
            })
        });
    }, async function handleResponse(res: http.IncomingMessage)
    {
        if (res.statusCode == 401 && res.headers['www-authenticate']?.startsWith('Basic'))
        {
            res.socket.end();
            const user = await question('username: ');
            const password = await question('password: ', { hidden: true });
            upgrade(url, { user, password });
        }
        else
        {
            if (res.statusCode)
            {
                res.on('data', function (d)
                {
                    console.log(d);
                })
            }
            console.log(res.statusCode && { statusCode: res.statusCode, headers: res.headers } || res);
        }
    })
}

const server = net.createServer();
server.listen(process.argv[3], () =>
    console.log(`listening on ${process.argv[3]}`));
upgrade(process.argv[2])
