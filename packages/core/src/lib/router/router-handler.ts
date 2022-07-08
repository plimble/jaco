import {AppError, InternalError, MethodNotFound, ValidateError} from '@plimble/jaco-common'
import {Context} from '../context'
import {Handler} from '../handler'
import {ApiRouter} from './router'
import {Guard} from './guard'
import {validate} from '@plimble/jaco-validator'
import {ApiInfo} from './controller'
import {getMetadataApi} from './metadata-storage'
import {HttpReq, HttpRes} from '../req'

export class RouterHandler implements Handler {
    constructor(private router: ApiRouter) {}

    async handle(payload: any, context: Context): Promise<HttpRes> {
        const req = context.getRequest() as HttpReq

        const result = this.router.getRoute(req.method, req.path)
        if (!result) {
            throw new AppError(MethodNotFound)
        }

        for (const [param, val] of Object.entries(result.params)) {
            payload[param] = val
        }

        const ctrlClass = await result.handler()
        const ctrl = context.getContainer().resolve(ctrlClass)

        const apiInfo: ApiInfo | undefined = getMetadataApi(ctrl.constructor)
        if (!apiInfo) {
            throw new AppError(InternalError).withMessage(`No Api decorator on ${ctrl.constructor}`)
        }

        if (apiInfo.guards) {
            for (const appInfoGuard of apiInfo.guards) {
                const guard = context.getContainer().resolve<Guard>(appInfoGuard)
                await guard.canActivate(req, apiInfo.security, context)
            }
        }

        if (apiInfo.input) {
            const errMsg = validate(apiInfo.input, payload)
            if (errMsg) {
                throw new AppError(ValidateError).withMessage(errMsg)
            }

            return await ctrl.handle(payload, context)
        }

        return await ctrl.handle(undefined, context)
    }
}
