import {MethodNotFound} from '@onedaycat/jaco-common'
import {Context} from '../../context'
import {ApiPayload, ApiResponse} from '../../event-parsers/api-gateway-event-parser'
import {Handler} from '../../handler'
import {ApiRouter} from './router'

export class RouterHandler implements Handler {
    constructor(private router: ApiRouter) {}

    async handle(payload: ApiPayload, context: Context): Promise<ApiResponse> {
        const result = this.router.getRoute(payload.method, payload.path)
        if (!result) {
            throw new MethodNotFound()
        }

        for (const [param, val] of Object.entries(result.params)) {
            payload.body[param] = val
        }

        const ctrlClass = await result.handler()
        const ctrl = context.getContainer().resolve(ctrlClass)

        return await ctrl.run(payload, context)
    }
}
