export interface Req<T = any> {
    requestId?: string
    functionName?: string
    timeout?: number
    payload: T
    raw?: any
}
