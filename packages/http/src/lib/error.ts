import type {HttpsRequestPayload} from './types'

export class HttpsClientException extends Error {
    readonly req: HttpsRequestPayload

    constructor(message: string, req: HttpsRequestPayload) {
        super(message)
        this.req = req
    }
}
