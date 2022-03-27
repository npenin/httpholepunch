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

        if (url.startsWith('https://'))
            return https.request(url, options).on('upgrade', handleUpgrade).on('response', handleResponse).flushHeaders();
        return http.request(url, options).on('upgrade', handleUpgrade).on('response', handleResponse).flushHeaders();
    })
}
