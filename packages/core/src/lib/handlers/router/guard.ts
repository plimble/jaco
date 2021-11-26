import {ApiPayload} from '../../event-parsers/api-gateway-event-parser'
import {Context} from '../../context'

export interface Guard {
    canActivate(payload: ApiPayload, context: Context): Promise<boolean>
}
