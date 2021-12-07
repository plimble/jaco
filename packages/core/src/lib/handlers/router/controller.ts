import 'reflect-metadata'
import {Constructor, PermissionDenied, ValidateError} from '@onedaycat/jaco-common'
import {Context} from '../../context'
import {ApiPayload, ApiResponse} from '../../event-parsers/api-gateway-event-parser'
import {Guard} from './guard'
import {plainToClass} from 'class-transformer'
import {validate} from 'class-validator'

export {JSONSchema as FieldInfo} from 'class-validator-jsonschema'

export interface ApiInfo {
    input?: Constructor<any>
    output: Constructor<any>
    security?: any
    guard?: Constructor<Guard>
    description?: string
}

const CTRL_KEY = Symbol('jaco:ctrl')

export function Api(info: ApiInfo): (target: any) => any {
    return function (target: any): any {
        Reflect.defineMetadata(CTRL_KEY, info, target)

        return target
    }
}

export abstract class Controller {
    async run(payload: ApiPayload, context: Context): Promise<ApiResponse<any>> {
        const apiInfo: ApiInfo | undefined = Reflect.getOwnMetadata(CTRL_KEY, this.constructor)
        if (apiInfo && apiInfo.guard) {
            const guard = context.getContainer().resolve<Guard>(apiInfo.guard)
            const isAuthorize = await guard.canActivate(payload, apiInfo.security, context)
            if (!isAuthorize) {
                throw new PermissionDenied()
            }
        }

        let input: any
        if (apiInfo?.input) {
            input = plainToClass(apiInfo.input, payload.body)
            const errs = await validate(input, {validationError: {target: false}})
            if (errs.length) {
                throw new ValidateError().withMessage(errs[0].toString())
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
