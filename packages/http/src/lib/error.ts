import type {HttpsRequestPayload} from './types'

export class HttpsClientException extends Error {
    constructor(
        message: string,
        public readonly req: HttpsRequestPayload,
    ) {
        super(message)
    }
}
