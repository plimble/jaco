import {APIGatewayProxyEventV2} from 'aws-lambda'
import {AppError, Singleton} from '@onedaycat/jaco-common'
import {APIGatewayProxyResult} from 'aws-lambda/trigger/api-gateway-proxy'
import {Context} from '../context'
import {EventParser} from '../event-parser'

export interface Authorizer {
    claims: {[name: string]: string | number | boolean | string[]}
    scopes: string[]
}

export type HttpHeaders = Record<string, string>

export interface ApiPayload<T = any> {
    readonly body: T
    readonly headers?: HttpHeaders
    readonly authorizer?: Authorizer
    readonly method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'
    readonly path: string
    readonly rawBody?: string
}

export interface ApiResponse<T = any> {
    body: T
    status?: number
    headers?: HttpHeaders
}

@Singleton()
export class ApiGatewayEventParser implements EventParser {
    static warpSuccess?: string
    static warpError?: string

    static defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    private static mergeHeaders(headers?: HttpHeaders): HttpHeaders {
        if (!headers) return ApiGatewayEventParser.defaultHeaders

        const mergedHeaders = {...ApiGatewayEventParser.defaultHeaders}
        for (const [key, val] of Object.entries(headers)) {
            if (!mergedHeaders[key]) {
                mergedHeaders[key] = val
            }
        }

        return mergedHeaders
    }

    private static mergeQueryAndBody(
        body?: any,
        query?: Record<string, string | undefined> | undefined,
        pathParams?: Record<string, string | undefined> | undefined,
    ): any {
        if (!body && !query && !pathParams) {
            return undefined
        }

        return Object.assign({}, query, body, pathParams)
    }

    parseRequest(event: APIGatewayProxyEventV2): ApiPayload {
        let body: any = undefined
        try {
            if (event.body) {
                body = JSON.parse(event.body)
            }
            body = ApiGatewayEventParser.mergeQueryAndBody(body, event.queryStringParameters, event.pathParameters)
            const auuthorizer = this.getAuthroizer(event)

            return {
                headers: event.headers as HttpHeaders,
                body: body,
                authorizer: auuthorizer,
                method: event.requestContext.http.method as any,
                path: event.requestContext.http.path,
                rawBody: event.body,
            }
        } catch (e) {
            throw new AppError(400, 'InvalidRequest', 'Invalid request').toErrorPayload()
        }
    }

    onParseRequestError(err: AppError, context: Context): APIGatewayProxyResult {
        let payload = err.toErrorPayload() as any
        if (err.status === 500) {
            payload.message = 'Server Error'
            payload.code = 'InternalError'
        }

        if (ApiGatewayEventParser.warpError) {
            payload = {[ApiGatewayEventParser.warpError]: payload}
        }

        return {
            statusCode: err.status,
            body: JSON.stringify(payload),
            headers: ApiGatewayEventParser.defaultHeaders,
        }
    }

    parseResponse(payload: ApiResponse, context: Context): APIGatewayProxyResult {
        let result = payload.body
        if (ApiGatewayEventParser.warpSuccess) {
            result = {[ApiGatewayEventParser.warpSuccess]: payload.body}
        }

        return {
            statusCode: payload.status ?? 200,
            body: JSON.stringify(result),
            headers: ApiGatewayEventParser.mergeHeaders(payload.headers),
        }
    }

    parseErrorResponse(err: AppError, context: Context): APIGatewayProxyResult {
        let payload = err.toErrorPayload() as any
        if (err.status === 500) {
            payload.message = 'Server Error'
            payload.code = 'InternalError'
        }

        if (ApiGatewayEventParser.warpError) {
            payload = {[ApiGatewayEventParser.warpError]: payload}
        }

        return {
            statusCode: err.status,
            body: JSON.stringify(payload),
            headers: ApiGatewayEventParser.defaultHeaders,
        }
    }

    getAuthroizer(event: APIGatewayProxyEventV2): Authorizer | undefined {
        if (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.jwt) {
            return {
                claims: event.requestContext.authorizer.jwt.claims,
                scopes: event.requestContext.authorizer.jwt.scopes ?? [],
            }
        }

        return undefined
    }
}
