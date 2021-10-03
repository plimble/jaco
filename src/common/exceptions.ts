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

export class HttpException extends Error {
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

export class InternalErrorException extends HttpException {
    // tslint:disable-next-line:unified-signatures
    constructor(code: string, msg: string)
    constructor(msg?: string)
    constructor(code: string, msg?: string) {
        if (!msg) {
            super(500, Exceptions.INTERNAL_ERROR, 'InternalError', code ?? 'Server error')
        } else {
            super(500, Exceptions.INTERNAL_ERROR, code, msg)
        }
    }
}

export class InvokeErrorException extends HttpException {
    constructor(msg: any = 'Invoke error') { super(500, Exceptions.INTERNAL_ERROR, 'InvokeError', msg) }
}

export class InvalidRequestException extends HttpException {
    constructor() { super(400, Exceptions.BAD_REQUEST, 'InvalidRequest', 'Input request is not valid format') }
}

export class ValidateErrorException extends HttpException {
    constructor() {super(400, Exceptions.BAD_REQUEST, 'ValidateError', 'Input value is not valid')}
}

export class InconsistencyException extends HttpException {
    constructor() {
        super(
            400,
            Exceptions.BAD_REQUEST,
            'Inconsistency',
            'Many request update in the same item at the same time',
        )
    }
}

export class PermissionDeniedException extends HttpException {
    constructor() {
        super(
            403,
            Exceptions.FORBIDDEN,
            'PermissionDenied',
            'You don\'t a permission to access this operation',
        )
    }
}

export class TimeoutErrorException extends HttpException {
    constructor() { super(408, Exceptions.TIMEOUT, 'TimeoutError', 'Request timeout') }
}

export class UnauthorizedException extends HttpException {
    constructor() { super(401, Exceptions.UNAUTHORIZED, 'Unauthorized', 'Request is not authorized') }
}

export class NotImplementedException extends HttpException {
    constructor() { super(503, Exceptions.UNAVAILABLE, 'NotImplemented', 'Not implemented') }
}

export class UnavailableException extends HttpException {
    constructor() { super(503, Exceptions.UNAVAILABLE, 'Unavailable', 'Method is available yet') }
}

export class MaintenanceException extends HttpException {
    constructor() { super(503, Exceptions.UNAVAILABLE, 'Maintenance', 'Method is maintenance') }
}

export class MethodNotFoundException extends HttpException {
    constructor() { super(404, Exceptions.NOT_FOUND, 'MethodNotFound', 'Method not found') }
}

export function errorFromPayload(payload: ErrorPayload | HttpExceptionPayload): HttpException {
    const error = new HttpException(
        payload.httpStatus,
        payload.type,
        payload.code,
        payload.message,
    )
    if ('name' in payload) {
        error.name = payload.name
    }
    if ('input' in payload) {
        error.withInput(payload.input)
    }
    if ('stack' in payload) {
        error.stack = payload.stack
    }
    if ('cause' in payload && payload.cause != null) {
        error.withCause(errorFromPayload(payload.cause))
    }

    return error
}

export function wrapError(e: any): HttpException {
    switch (true) {
        case e instanceof HttpException:
            return e
        case e instanceof Error: {
            const err = new InternalErrorException(e.name, e.message)
            err.stack = e.stack
            return err
        }
        case typeof e === 'object':
            return new InternalErrorException(JSON.stringify(e))
        case e == null:
            return new InternalErrorException()
        default:
            return new InternalErrorException(e.toString ? e.toString() : 'Unknown Error')
    }
}
