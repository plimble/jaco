import {Constructor} from './types'

export enum Exceptions {
    NOT_FOUND = 'NotFound',
    BAD_REQUEST = 'BadRequest',
    TIMEOUT = 'Timeout',
    FORBIDDEN = 'Forbidden',
    UNAUTHORIZED = 'Unauthorized',
    INTERNAL_ERROR = 'InternalError',
    UNAVAILABLE = 'Unavailable',
}

export interface ErrorPayload {
    code: string
    type: string
    message: string
    httpStatus: number
}

export interface HttpExceptionPayload {
    name: string
    code: string
    type: string
    message: string
    httpStatus: number
    stack?: string
    input?: any
    cause?: HttpExceptionPayload
}

export interface HttpExceptionInput {
    status: number
    code: string
    msg: string
}

export enum ExceptionCode {
    ValidateError = 'ValidateError',
    MethodNotFound = 'MethodNotFound',
    Maintenance = 'Maintenance',
    PermissionDenied = 'PermissionDenied',
    NotImplemented = 'NotImplemented',
    Unauthorized = 'Unauthorized',
    TimeoutError = 'TimeoutError',
    InternalError = 'InternalError',
}

export type HttpExceptionInfo = Record<string, HttpExceptionInput>

export class HttpException extends Error {
    static create(input: HttpExceptionInput): HttpException {
        let type: Exceptions = Exceptions.INTERNAL_ERROR
        switch (input.status) {
            case 400:
                type = Exceptions.BAD_REQUEST
                break
            case 404:
                type = Exceptions.NOT_FOUND
                break
            case 401:
                type = Exceptions.UNAUTHORIZED
                break
            case 403:
                type = Exceptions.FORBIDDEN
                break
            case 408:
                type = Exceptions.TIMEOUT
                break
            case 500:
                type = Exceptions.INTERNAL_ERROR
                break
            case 503:
                type = Exceptions.UNAVAILABLE
                break
        }

        return new HttpException(input.status, type, input.code, input.msg)
    }

    static fromCode(code: ExceptionCode, msg?: string): HttpException {
        switch (code) {
            case ExceptionCode.ValidateError:
                return new HttpException(400, Exceptions.BAD_REQUEST, code, msg ?? 'Input value is not valid')
            case ExceptionCode.MethodNotFound:
                return new HttpException(404, Exceptions.NOT_FOUND, code, msg ?? 'Method not found')
            case ExceptionCode.Maintenance:
                return new HttpException(503, Exceptions.UNAVAILABLE, code, msg ?? 'maintenance')
            case ExceptionCode.PermissionDenied:
                return new HttpException(403, Exceptions.FORBIDDEN, code, msg ?? 'Permission denied')
            case ExceptionCode.NotImplemented:
                return new HttpException(503, Exceptions.UNAVAILABLE, code, msg ?? 'Not implemented')
            case ExceptionCode.Unauthorized:
                return new HttpException(401, Exceptions.UNAUTHORIZED, code, msg ?? 'Request is not authorized')
            case ExceptionCode.TimeoutError:
                return new HttpException(408, Exceptions.TIMEOUT, code, msg ?? 'Request timeout')
            case ExceptionCode.InternalError:
                return new HttpException(500, Exceptions.INTERNAL_ERROR, code, msg ?? 'Internal error')
        }
    }

    private errorInput?: any
    private errorCause?: HttpException

    constructor(
        readonly status: number,
        readonly type: string,
        readonly code: string,
        message?: string,
    ) {
        super(message)
        this.name = this.code
    }

    get input(): any | undefined {
        return this.errorInput
    }

    get cause(): (HttpException | undefined) {
        return this.errorCause
    }

    withInput(input: any): HttpException {
        this.errorInput = input
        return this
    }

    withCause(cause: any): HttpException {
        this.errorCause = wrapError(cause)
        return this
    }

    withMessage(message: string): HttpException {
        this.message = message
        return this
    }

    hasError(err: Constructor<HttpException>): boolean {
        const cause = this.errorCause
        if (this instanceof err) {
            return true
        }

        if (cause) {
            return cause.hasError(err)
        }

        return false
    }

    toErrorPayload(): ErrorPayload {
        return {
            code: this.code,
            type: this.type,
            message: this.message,
            httpStatus: this.status,
        }
    }

    toJSON(): HttpExceptionPayload {
        return {
            name: this.name,
            code: this.code,
            type: this.type,
            message: this.message,
            httpStatus: this.status,
            stack: this.stack,
            input: this.errorInput,
            cause: this.errorCause?.toJSON(),
        }
    }
}

export function wrapError(e: any): HttpException {
    switch (true) {
        case e instanceof HttpException:
            return e
        case e instanceof Error: {
            const err = HttpException.fromCode(ExceptionCode.InternalError)
            err.name = e.name
            err.message = e.message
            err.stack = e.stack
            return err
        }
        case typeof e === 'object':
            return HttpException.fromCode(ExceptionCode.InternalError, JSON.stringify(e))
        case e == null:
            return HttpException.fromCode(ExceptionCode.InternalError)
        default:
            return HttpException.fromCode(ExceptionCode.InternalError, e.toString ? e.toString() : 'Unknown Error')
    }
}
