import {AppErrorInfo, Constructor} from '@onedaycat/jaco-common'
import {Context} from '../../context'
import {ApiResponse} from '../../event-parsers/api-gateway-event-parser'
import {Guard} from './guard'
import {CTRL_KEY} from './metadata-storage'

export interface ApiInfo {
    input?: Constructor<any>
    output: Constructor<any>
    security?: any
    guard?: Constructor<Guard>
    description?: string
    errors?: AppErrorInfo[]
}

export function Api(info: ApiInfo): (target: any) => any {
    return function (target: any): any {
        Reflect.defineMetadata(CTRL_KEY, info, target)

        return target
    }
}

export interface Controller {
    handle(body: any, context: Context): Promise<ApiResponse>
}
