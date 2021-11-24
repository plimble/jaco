export interface ErrorPayload {
    code: string
    message: string
    httpStatus: number
}

export interface AppErrorPayload {
    name: string
    code: string
    message: string
    httpStatus: number
    stack?: string
    input?: any
    cause?: AppErrorPayload
}

export interface AppErrorInfo {
    code: string
    status: number
    msg: string
}

const errorRegistered: Record<string, AppErrorInfo> = {}

// export const ValidateError = (code?: string) =>
//     AppError.create(400, code ?? 'ValidateError', 'Input value is not valid')
// export const MethodNotFound = (code?: string) => AppError.create(404, code ?? 'MethodNotFound', 'Method not found')
// export const Maintenance = (code?: string) => AppError.create(503, code ?? 'Maintenance', 'maintenance')
// export const PermissionDenied = (code?: string) => AppError.create(403, code ?? 'PermissionDenied', 'Permission denied')
// export const NotImplemented = (code?: string) => AppError.create(503, code ?? 'NotImplemented', 'Not implemented')
// export const Unauthorized = (code?: string) => AppError.create(401, code ?? 'Unauthorized', 'Request is not authorized')
// export const TimeoutError = (code?: string) => AppError.create(408, code ?? 'TimeoutError', 'Request timeout')
// export const InternalError = (code?: string) => AppError.create(500, code ?? 'InternalError', 'Internal error')

export class AppError extends Error {
    readonly code: string
    readonly status: number
    private errorInput?: any
    private errorCause?: AppError

    constructor(appErrorInfo: AppErrorInfo)
    constructor(status: number, code: string, message: string)
    constructor(status: AppErrorInfo | number, code?: string, message?: string) {
        if (typeof status === 'number') {
            super(message)
            this.name = code as string
            this.code = code as string
            this.status = status as number
        } else {
            super(status.msg)
            this.name = status.code
            this.code = status.code
            this.status = status.status
        }
    }

    get input(): any | undefined {
        return this.errorInput
    }

    get cause(): AppError | undefined {
        return this.errorCause
    }

    rootCause(): AppError {
        const cause = this.errorCause

        if (cause) {
            return cause.rootCause()
        }

        return this
    }

    withInput(input: any): AppError {
        this.errorInput = input

        return this
    }

    withCause(cause: any): AppError {
        this.errorCause = wrapError(cause)

        return this
    }

    withMessage(message: string): AppError {
        this.message = message

        return this
    }

    is(err: AppError | AppErrorInfo | string): boolean {
        const cause = this.errorCause

        if (err instanceof AppError && this.code === err.code) {
            return true
        } else if (typeof err === 'string' && this.code === err) {
            return true
        } else if ((err as AppErrorInfo).code === this.code) {
            return true
        }

        if (cause) {
            return cause.is(err)
        }

        return false
    }

    toErrorPayload(): ErrorPayload {
        return {
            code: this.code,
            message: this.message,
            httpStatus: this.status,
        }
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
}

export class ValidateError extends AppError {
    constructor(msg?: string) {
        super(400, 'ValidateError', msg ?? 'Input value is not valid')
    }
}

export class MethodNotFound extends AppError {
    constructor(msg?: string) {
        super(404, 'MethodNotFound', msg ?? 'Method not found')
    }
}

export class Maintenance extends AppError {
    constructor(msg?: string) {
        super(503, 'Maintenance', msg ?? 'Maintenance')
    }
}

export class PermissionDenied extends AppError {
    constructor(msg?: string) {
        super(403, 'PermissionDenied', msg ?? 'Permission denied')
    }
}

export class NotImplemented extends AppError {
    constructor(msg?: string) {
        super(503, 'NotImplemented', msg ?? 'Not implemented')
    }
}

export class Unauthorized extends AppError {
    constructor(msg?: string) {
        super(401, 'Unauthorized', msg ?? 'Request is not authorized')
    }
}

export class TimeoutError extends AppError {
    constructor(msg?: string) {
        super(408, 'TimeoutError', msg ?? 'Request timeout')
    }
}

export class InternalError extends AppError {
    constructor(msg?: string) {
        super(500, 'InternalError', msg ?? 'Internal error')
    }
}

export function isError(e: any, code: string | AppErrorInfo): boolean {
    const appCode = typeof code === 'string' ? code : code.code
    if (e instanceof AppError) {
        return e.is(appCode)
    }

    if (e instanceof Error) {
        return e.name === appCode
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
        case typeof e === 'object':
            return new AppError(500, 'InternalError', JSON.stringify(e))
        case e == null:
            return new AppError(500, 'InternalError', 'Internal error')
        default:
            return new AppError(500, 'InternalError', e.toString ? e.toString() : 'Unknown Error')
    }
}

export function registerError<T extends Record<string, [number, string]>>(errInfos: T): Record<keyof T, AppErrorInfo> {
    for (const [code, errInfo] of Object.entries(errInfos)) {
        errorRegistered[code] = {status: errInfo[0], msg: errInfo[1], code}
    }

    return errorRegistered as Record<keyof T, AppErrorInfo>
}
