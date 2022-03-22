export interface Authorizer {
    claims: {[name: string]: string | number | boolean | string[]}
    scopes: string[]
}

export type HttpHeaders = Record<string, string>

export interface Req<T = any> {
    requestId?: string
    functionName?: string
    timeout?: number
    payload: T
    raw?: any
}

export interface HttpReq<T = any> extends Req<T> {
    readonly headers?: HttpHeaders
    readonly authorizer?: Authorizer
    readonly method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'
    readonly path: string
    readonly rawBody?: string
}

export interface HttpRes<T = any> {
    body: T | undefined
    status?: number
    headers?: HttpHeaders
}
