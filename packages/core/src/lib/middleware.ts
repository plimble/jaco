import type {Req} from './req'
import {Context} from './context'

export type Next = Promise<any>

export interface Middleware {
    use(req: Req, context: Context, next: Next): Promise<any>
}
