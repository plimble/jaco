import {Context} from './context'

export interface Handler {
    handle(input: any, context: Context): Promise<any>
}
