import {Api, Context, Controller, HttpRes} from '@plimble/jaco-core'
import {Account} from './model/account'
import {InternalError, Unauthorized} from '@plimble/jaco-common'

@Api({
    input: Account,
    output: Account,
    errors: [InternalError, Unauthorized],
})
export class Ctrl1 implements Controller {
    async handle(body: undefined, context: Context): Promise<HttpRes> {
        return {
            body: undefined,
        }
    }
}
