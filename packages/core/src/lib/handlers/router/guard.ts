import {ApiPayload} from '../../event-parsers/api-gateway-event-parser'
import {Context} from '../../context'

export interface Guard {
    canActivate(payload: ApiPayload, security: any, context: Context): Promise<boolean>
}
