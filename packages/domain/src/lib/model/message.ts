export interface Message<T extends Record<string, any> = Record<string, any>> {
    id: string
    type: string
    payload: T
    time: number
    partitionKey?: string
}
