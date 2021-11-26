export interface Req<T = any> {
    functionName?: string;
    payload: T;
    raw?: any;
}
