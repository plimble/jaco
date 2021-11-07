import {HttpsClientException} from './error'
import https from 'https'
import http from 'http'
import fetch from 'node-fetch'
import type {HttpRequestOptions, HttpsRequestPayload, HttpsResponse} from './types'
import {AbortController} from 'abort-controller'

const httpAgent = new http.Agent({
    keepAlive: true,
})

const httpsAgent = new https.Agent({
    keepAlive: true,
})

export class HttpClient {
    private readonly maxRetry: number
    private readonly delayRetry: number
    private readonly timeout: number

    constructor(options?: HttpRequestOptions) {
        this.timeout = options?.timeout ?? 30000
        this.maxRetry = options?.maxRetry ?? 5
        this.delayRetry = options?.delayRetry ?? 100
    }

    async request(req: HttpsRequestPayload): Promise<HttpsResponse> {
        let url: string
        if (req.query) {
            url = `${req.url}${req.path}?${req.query}`
        } else {
            url = `${req.url}${req.path}`
        }

        return await this.send(url, req)
    }
    
    private async send(url: string, req: HttpsRequestPayload): Promise<HttpsResponse> {
        for (let i = 0; i < this.maxRetry; i++) {
            const controller = new AbortController()
            const timeout = setTimeout(() => {
                controller.abort()
            }, req.timeout ?? this.timeout)

            try {
                const res = await fetch(url, {
                    headers: req.headers,
                    method: req.method,
                    body: req.body,
                    signal: controller.signal,
                    agent: function (_parsedURL) {
                        if (_parsedURL.protocol == 'http:') {
                            return httpAgent
                        } else {
                            return httpsAgent
                        }
                    },
                })

                if (res.status === 502 || res.status === 408) {
                    await this.sleep(this.delayRetry)
                    continue
                }

                const resBody = await res.buffer()
                const resHeaders: Record<string, string> = {}
                for (const [key, value] of res.headers.entries()) {
                    resHeaders[key] = value
                }

                return {
                    req,
                    body: resBody,
                    isError: !res.ok,
                    status: res.status,
                    headers: resHeaders,
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    await this.sleep(this.delayRetry)
                } else if (e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET' || e.code === 'EPIPE' || e.message === 'Timeout reached') {
                    await this.sleep(this.delayRetry)
                } else {
                    throw new HttpsClientException(e.message, req)
                }
            } finally {
                clearTimeout(timeout)
            }
        }

        throw new HttpsClientException('No Request', req)
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
