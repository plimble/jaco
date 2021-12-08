import 'reflect-metadata'
import {AppError, AppErrorInfo, Constructor, PermissionDenied, ValidateError} from '@onedaycat/jaco-common'
import {Context} from '../../context'
import {ApiPayload, ApiResponse} from '../../event-parsers/api-gateway-event-parser'
import {Guard} from './guard'
import {plainToClass} from 'class-transformer'
import {validate} from '@onedaycat/jaco-validator'

export interface ApiInfo {
    input?: Constructor<any>
    output: Constructor<any>
    security?: any
    guard?: Constructor<Guard>
    description?: string
    errors?: AppErrorInfo[]
}

const CTRL_KEY = Symbol('jaco:ctrl')

export function Api(info: ApiInfo): (target: any) => any {
    return function (target: any): any {
        Reflect.defineMetadata(CTRL_KEY, info, target)

        return target
    }
}

export abstract class Controller {
    async run(payload: ApiPayload, context: Context): Promise<ApiResponse> {
        const apiInfo: ApiInfo | undefined = Reflect.getOwnMetadata(CTRL_KEY, this.constructor)
        if (apiInfo && apiInfo.guard) {
            const guard = context.getContainer().resolve<Guard>(apiInfo.guard)
            const isAuthorize = await guard.canActivate(payload, apiInfo.security, context)
            if (!isAuthorize) {
                throw new AppError(PermissionDenied)
            }
        }

        let input: any
        if (apiInfo?.input) {
            input = plainToClass(apiInfo.input, payload.body)
            const errMsg = validate(apiInfo.input, input)
            if (errMsg) {
                throw new AppError(ValidateError).withMessage(errMsg)
            }

            return await this.handle(input, context)
        }

        return await this.handle(undefined, context)
    }

    abstract handle(body: any, context: Context): Promise<ApiResponse>
}

export function getMetadataApi(target: any): ApiInfo | undefined {
    return Reflect.getOwnMetadata(CTRL_KEY, target)
}
