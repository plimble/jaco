export interface AppErrorPayload {
    cause?: AppErrorPayload
    code: string
    httpStatus: number
    input?: any
    message: string
    name: string
    stack?: string
}

/**
 * AppErrorSchema
 * [status, code, message]
 */
export type AppErrorSchema = () => any[]

const ExceptionsStatusName: Record<number, string> = {
    404: 'NotFound',
    400: 'BadRequest',
    408: 'Timeout',
    403: 'Forbidden',
    401: 'Unauthorized',
    500: 'InternalError',
    503: 'Unavailable',
}

export class AppError extends Error {
    readonly code: string
    readonly status: number
    private errorCause?: AppError
    private errorInput?: any

    constructor(appErrorSchema: AppErrorSchema)
    constructor(status: number, code: string, message: string)
    constructor(status: AppErrorSchema | number, code?: string, message?: string) {
        if (typeof status === 'function') {
            const schema = status()
            super(schema[2] ?? ExceptionsStatusName[schema[0]])
            this.code = schema[1]
            this.status = schema[0]
        } else {
            super(message)
            this.code = code as string
            this.status = status as number
        }
    }

    get cause(): AppError | undefined {
        return this.errorCause
    }

    get input(): any | undefined {
        return this.errorInput
    }

    is(err: AppError | AppErrorSchema | string | undefined): boolean {
        const cause = this.errorCause

        if (!err) {
            return false
        } else if (err instanceof AppError && this.code === err.code) {
            return true
        } else if (typeof err === 'string' && this.code === err) {
            return true
        } else if (typeof err === 'function') {
            const schema = err()
            if (schema[1] === this.code) {
                return true
            }
        }

        if (cause) {
            return cause.is(err)
        }

        return false
    }

    rootCause(): AppError {
        const cause = this.errorCause

        if (cause) {
            return cause.rootCause()
        }

        return this
    }

    toJSON(): AppErrorPayload {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            httpStatus: this.status,
            stack: this.stack,
            input: this.errorInput,
            cause: this.errorCause?.toJSON(),
        }
    }

    withCause(cause: any): AppError {
        this.errorCause = wrapError(cause)

        return this
    }

    withInput(input: any): AppError {
        this.errorInput = input

        return this
    }

    withMessage(message: string): AppError {
        this.message = message

        return this
    }
}

export const ValidateError = () => [400, 'ValidateError', 'Input value is not valid']
export const MethodNotFound = () => [404, 'MethodNotFound', 'Method not found']
export const Maintenance = () => [503, 'Maintenance', 'Maintenance']
export const PermissionDenied = () => [403, 'PermissionDenied', 'Permission denied']
export const NotImplemented = () => [503, 'NotImplemented', 'Not implemented']
export const Unauthorized = () => [401, 'Unauthorized', 'Request is not authorized']
export const TimeoutError = () => [408, 'TimeoutError', 'Request timeout']
export const InternalError = () => [500, 'InternalError', 'Internal error']
export const InvalidRequestError = () => [400, 'InvalidRequestError', 'Invalid request']

export function isAppError(err: any, code?: AppError | AppErrorSchema | string | undefined): err is AppError {
    if (err instanceof AppError) {
        if (code) {
            return err.is(code)
        }

        return true
    }

    return false
}

export function wrapError(e: any): AppError {
    switch (true) {
        case e instanceof AppError:
            return e
        case e instanceof Error: {
            const err = new AppError(500, e.name, e.message)
            err.stack = e.stack

            return err
        }
        case typeof e === 'function':
            return new AppError(e)
        case typeof e === 'object':
            return new AppError(500, 'InternalError', JSON.stringify(e))
        case e == null:
            return new AppError(500, 'InternalError', 'Internal error')
        default:
            return new AppError(500, 'InternalError', e.toString ? e.toString() : 'Unknown Error')
    }
}
