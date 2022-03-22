import {Context} from '../context'
import {HttpReq} from '../req'

export interface Guard {
    canActivate(payload: HttpReq, security: any, context: Context): Promise<void>
}
