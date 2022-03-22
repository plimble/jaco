import {AppError, ExceptionsStatusName} from '@onedaycat/jaco-common'
import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResult} from 'aws-lambda/trigger/api-gateway-proxy'
import {Authorizer, HttpHeaders, HttpReq, HttpRes} from '@onedaycat/jaco-core'
import {EventParser} from './resolve-event-parser'

export class ApiGatewayParser {
    static apiGatewayParserResError = (err: AppError): string => {
        const payload = {
            code: err.code,
            type: ExceptionsStatusName[err.status] ?? 'Unknown',
            message: err.message,
        }

        if (err.status === 500) {
            payload.message = 'Server Error'
            payload.code = 'InternalError'
        }

        return JSON.stringify(payload)
    }

    static apiGatewayParserResSuccess = (payload: any): string => {
        return typeof payload === 'string' ? payload : JSON.stringify(payload)
    }

    static onParseRequestError(err: AppError): APIGatewayProxyResult {
        const payload = ApiGatewayParser.apiGatewayParserResError(err)

        return {
            statusCode: err.status,
            body: payload,
            headers: ApiGatewayParser.defaultHeaders,
        }
    }

    static parseErrorResponse(err: AppError): APIGatewayProxyResult {
        const payload = ApiGatewayParser.apiGatewayParserResError(err)

        return {
            statusCode: err.status,
            body: payload,
            headers: ApiGatewayParser.defaultHeaders,
        }
    }

    static parseRequest(event: APIGatewayProxyEventV2WithJWTAuthorizer): HttpReq {
        let body: any = undefined
        try {
            if (event.body) {
                body = JSON.parse(event.body)
            }
            body = ApiGatewayParser.mergeQueryAndBody(body, event.queryStringParameters, event.pathParameters)
            const auuthorizer = ApiGatewayParser.getAuthroizer(event)

            return {
                headers: event.headers as HttpHeaders,
                payload: body,
                authorizer: auuthorizer,
                method: event.requestContext.http.method as any,
                path: event.requestContext.http.path,
                rawBody: event.body,
            }
        } catch (e) {
            throw new AppError(400, 'InvalidRequest', 'Invalid request')
        }
    }

    static parseResponse(payload: HttpRes): APIGatewayProxyResult {
        return {
            statusCode: payload.status ?? 200,
            body: payload.body ? ApiGatewayParser.apiGatewayParserResSuccess(payload.body) : '',
            headers: ApiGatewayParser.mergeHeaders(payload.headers),
        }
    }

    static resolve(event: any): EventParser | undefined {
        if (event.routeKey && event.version) {
            return ApiGatewayParser
        }

        return undefined
    }

    static defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    private static getAuthroizer(event: APIGatewayProxyEventV2WithJWTAuthorizer): Authorizer | undefined {
        if (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.jwt) {
            return {
                claims: event.requestContext.authorizer.jwt.claims,
                scopes: event.requestContext.authorizer.jwt.scopes ?? [],
            }
        }

        return undefined
    }

    private static mergeHeaders(headers?: HttpHeaders): HttpHeaders {
        if (!headers) return ApiGatewayParser.defaultHeaders

        const mergedHeaders = {...ApiGatewayParser.defaultHeaders}
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
}
