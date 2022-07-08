import {AppErrorSchema, Constructor} from '@plimble/jaco-common'
import {Context} from '../context'
import {Guard} from './guard'
import {CTRL_KEY} from './metadata-storage'

export interface ApiInfo {
    input?: Constructor<any>
    output: Constructor<any>
    security?: any
    guards?: Constructor<Guard>[]
    description?: string
    errors?: AppErrorSchema[]
}

export function Api(info: ApiInfo): (target: any) => any {
    return function (target: any): any {
        Reflect.defineMetadata(CTRL_KEY, info, target)

        return target
    }
}

export interface Controller {
    handle(body: any, context: Context): Promise<any>
}
