import {AppError, InternalError, MethodNotFound, ValidateError} from '@onedaycat/jaco-common'
import {Context} from '../../context'
import {ApiPayload, ApiResponse} from '../../event-parsers/api-gateway-event-parser'
import {Handler} from '../../handler'
import {ApiRouter} from './router'
import {Guard} from './guard'
import {validate} from '@onedaycat/jaco-validator'
import {ApiInfo} from './controller'
import {getMetadataApi} from './metadata-storage'

export class RouterHandler implements Handler {
    constructor(private router: ApiRouter) {}

    async handle(payload: ApiPayload, context: Context): Promise<ApiResponse> {
        const result = this.router.getRoute(payload.method, payload.path)
        if (!result) {
            throw new AppError(MethodNotFound)
        }

        for (const [param, val] of Object.entries(result.params)) {
            payload.body[param] = val
        }

        const ctrlClass = await result.handler()
        const ctrl = context.getContainer().resolve(ctrlClass)

        const apiInfo: ApiInfo | undefined = getMetadataApi(ctrl.constructor)
        if (!apiInfo) {
            throw new AppError(InternalError).withMessage(`No Api decorator on ${ctrl.constructor}`)
        }

        if (apiInfo.guard) {
            const guard = context.getContainer().resolve<Guard>(apiInfo.guard)
            await guard.canActivate(payload, apiInfo.security, context)
        }

        if (apiInfo.input) {
            const errMsg = validate(apiInfo.input, payload.body)
            if (errMsg) {
                throw new AppError(ValidateError).withMessage(errMsg)
            }

            return await ctrl.handle(payload.body, context)
        }

        return await ctrl.handle(undefined, context)
    }
}
