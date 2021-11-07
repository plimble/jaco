import {HttpsClientException} from './error'
import https from 'https'
import http from 'http'
import fetch, {AbortError} from 'node-fetch'
import type {HttpRequestOptions, HttpsRequestPayload, HttpsResponse} from './types'

const httpAgent = new http.Agent({
    keepAlive: true,
})

const httpsAgent = new https.Agent({
    keepAlive: true,
})

export class HttpClient {
    private readonly controller: AbortController
    private readonly maxRetry: number
    private readonly delayRetry: number
    private readonly timeout: number
    private readonly agent: any

    constructor(options?: HttpRequestOptions) {
        this.controller = new AbortController()
        this.timeout = options?.timeout ?? 30000
        this.maxRetry = options?.maxRetry ?? 5
        this.delayRetry = options?.delayRetry ?? 100
        this.agent = options?.http ? httpAgent : httpsAgent
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

    private timeoutSignal(timeout?: number): void {
        setTimeout(() => {
            this.controller.abort()
        }, timeout ?? this.timeout)
    };

    private async send(url: string, req: HttpsRequestPayload): Promise<HttpsResponse> {
        for (let i = 0; i < this.maxRetry; i++) {
            try {
                this.timeoutSignal(req.timeout)
                const res = await fetch(url, {
                    headers: req.headers,
                    method: req.method,
                    body: req.body,
                    signal: this.controller.signal,
                    agent: this.agent,
                })

                if (res.status === 502 || res.status === 408) {
                    await this.sleep(this.delayRetry)
                    continue
                }

                const resBody = await res.buffer()

                return {
                    req,
                    body: resBody,
                    isError: !res.ok,
                    status: res.status,
                }
            } catch (e: any) {
                if (e instanceof AbortError) {
                    await this.sleep(this.delayRetry)
                } else if (e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET' || e.code === 'EPIPE' || e.message === 'Timeout reached') {
                    await this.sleep(this.delayRetry)
                } else {
                    throw new HttpsClientException(e.message, req)
                }
            }
        }

        throw new HttpsClientException('No Request', req)
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
