import {PermissionDenied, ValidateError} from '@onedaycat/jaco-common'
import Joi from 'joi'
import {Context} from '../../context'
import {ApiPayload, ApiResponse} from '../../event-parsers/api-gateway-event-parser'
import {Guard} from './guard'

export abstract class Controller {
    protected validate?: Joi.ObjectSchema
    protected guard?: Guard

    async run(payload: ApiPayload, context: Context): Promise<ApiResponse<any>> {
        if (this.guard) {
            const isAuthorize = await this.guard.canActivate(payload, context)
            if (!isAuthorize) {
                throw new PermissionDenied()
            }
        }

        if (this.validate) {
            const {error} = this.validate.unknown().validate(payload.body)
            if (error) {
                throw new ValidateError().withMessage(error.details[0].message)
            }
        }

        return await this.handle(payload.body, context)
    }

    abstract handle(body: any, context: Context): Promise<ApiResponse<any>>
}
