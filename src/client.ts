import http, { OutgoingHttpHeaders } from 'http'
import https from 'https'
import net from 'net'

export function punch(url: string, upgradeMethod: string, credentials?: { user: string, password: string }, headers?: OutgoingHttpHeaders)
{
    headers = { connection: 'Upgrade', upgrade: upgradeMethod, ...headers };
    const options: http.RequestOptions | https.RequestOptions = { headers };
    if (credentials)
        options.auth = credentials.user + ':' + credentials.password;

    return new Promise<net.Socket>((resolve, reject) =>
    {
        function handleUpgrade(res: http.IncomingMessage, httpsocket: net.Socket)
        {
            resolve(httpsocket)
        }

        function handleResponse(res: http.IncomingMessage)
        {
            if (res.statusCode == 101 && res.headers.connection?.toLowerCase() == 'upgrade')
                resolve(res.socket);
            else
                reject(res);
        }

        if (process.env.HTTP_PROXY)
        {
            const proxyOptions: http.RequestOptions = { method: 'CONNECT' };
            const proxyUrl = new URL(process.env.HTTP_PROXY);
            proxyOptions.host = proxyUrl.hostname;
            proxyOptions.port = proxyUrl.port;
            proxyOptions.headers = { host: new URL(url).host, proxyConnection: 'keep-alive' };
            if (url.startsWith('https://'))
            {
                proxyOptions.headers.host += ':443';
                proxyOptions.path = proxyOptions.headers.host as string;

                console.log(proxyOptions);
                return http.request(proxyOptions).on('connect', (res, socket) =>
                {
                    if (res.statusCode == 200)
                    {
                        const agent = new https.Agent({ socket });
                        options.agent = agent;
                        https.request(url, options).on('upgrade', handleUpgrade).on('response', handleResponse).flushHeaders();
                        return;
                    }
                    return reject(res);
                }).on('error', reject).end();
            }
            proxyOptions.path = proxyOptions.headers.host as string;

            return http.request(proxyOptions).on('connect', (res, socket) =>
            {
                if (res.statusCode == 200)
                {
                    const agent = new https.Agent({ socket });
                    options.agent = agent;
                    http.request(url, options).on('upgrade', handleUpgrade).on('response', handleResponse).flushHeaders();
                    return;
                }
                return reject(res);
            }).on('error', reject).end();
        }
        if (url.startsWith('https://'))
            return https.request(url, options).on('upgrade', handleUpgrade).on('response', handleResponse).on('error', reject).flushHeaders();
        return http.request(url, options).on('upgrade', handleUpgrade).on('response', handleResponse).on('error', reject).flushHeaders();
    })
}
