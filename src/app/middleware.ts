import {Context} from './context'

export type Next = () => Promise<void>

export interface Middleware {
    use(event: Req, res: Res, context: Context, next: Next): Promise<void>
}
