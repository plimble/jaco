export interface HttpRequestOptions {
    http?: boolean
    maxRetry?: number
    delayRetry?: number
    timeout?: number
}

export interface HttpsRequestPayload {
    name?: string
    url: string
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'
    path: string
    body?: string
    query?: string
    headers?: { [name: string]: string }
    timeout?: number
}

export interface HttpsResponse {
    isError: boolean
    body: Buffer
    req: HttpsRequestPayload
    status: number
    headers: Record<string, string>
}
