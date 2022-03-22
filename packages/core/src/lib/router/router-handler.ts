import {AppError, InternalError, MethodNotFound, ValidateError} from '@onedaycat/jaco-common'
import {Context} from '../context'
import {Handler} from '../handler'
import {ApiRouter} from './router'
import {Guard} from './guard'
import {validate} from '@onedaycat/jaco-validator'
import {ApiInfo} from './controller'
import {getMetadataApi} from './metadata-storage'
import {HttpReq} from '../req'
import {HttpRes} from '../res'

export class RouterHandler implements Handler {
    constructor(private router: ApiRouter) {}

    async handle(req: HttpReq, context: Context): Promise<HttpRes> {
        const result = this.router.getRoute(req.method, req.path)
        if (!result) {
            throw new AppError(MethodNotFound)
        }

        for (const [param, val] of Object.entries(result.params)) {
            req.payload[param] = val
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
            const errMsg = validate(apiInfo.input, req.payload)
            if (errMsg) {
                throw new AppError(ValidateError).withMessage(errMsg)
            }

            return await ctrl.handle(req.payload, context)
        }

        return await ctrl.handle(undefined, context)
    }
}
