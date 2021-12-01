export interface Req<T = any> {
    functionName?: string
    timeout?: number
    payload: T
    raw?: any
}
