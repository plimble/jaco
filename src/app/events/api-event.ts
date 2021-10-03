import {APIGatewayProxyEventV2} from 'aws-lambda'

export interface Authorizer {
    claims: Record<string, string | number | boolean | string[]>
    scopes: string[]
}

export type BlobBody = string

export class ApiEvent<T = undefined> {
    readonly routeKey: string
    readonly body: T
    readonly cookies: Set<string>
    readonly headers: Map<string, string>
    readonly queryParams: Map<string, string>
    readonly pathParams: Map<string, string>
    readonly authorizer?: Authorizer
    readonly isBase64Encoded: boolean
    readonly raw: APIGatewayProxyEventV2

    constructor(lambdaEvent: APIGatewayProxyEventV2) {
        this.routeKey = lambdaEvent.routeKey
        this.cookies = new Set<string>(lambdaEvent.cookies)
        this.headers = new Map<string, string>()
        this.queryParams = new Map<string, string>()
        this.pathParams = new Map<string, string>()
        this.raw = lambdaEvent
        this.body = undefined as any
        this.isBase64Encoded = lambdaEvent.isBase64Encoded
        if (lambdaEvent.body) {
            this.body = JSON.parse(lambdaEvent.body)
        }
        if (lambdaEvent.requestContext.authorizer) {
            this.authorizer = {
                claims: lambdaEvent.requestContext.authorizer.jwt.claims,
                scopes: lambdaEvent.requestContext.authorizer.jwt.scopes,
            }
        }
        if (lambdaEvent.pathParameters) {
            Object.entries(lambdaEvent.pathParameters).forEach(([key, val]) => {
                if (val) {
                    this.pathParams.set(key, val)
                }
            })
        }
        if (lambdaEvent.headers) {
            Object.entries(lambdaEvent.headers).forEach(([key, val]) => {
                if (val) {
                    this.headers.set(key, val)
                }
            })
        }
        if (lambdaEvent.queryStringParameters) {
            Object.entries(lambdaEvent.queryStringParameters).forEach(([key, val]) => {
                if (val) {
                    this.queryParams.set(key, val)
                }
            })
        }
    }
}
