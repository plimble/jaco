import {Api, ApiResponse, Context, Controller} from '@onedaycat/jaco'
import {Account} from './model/account'
import {InternalError, Unauthorized} from '@onedaycat/jaco-common'

@Api({
    input: Account,
    output: Account,
    errors: [InternalError, Unauthorized],
})
export class Ctrl1 extends Controller {
    async handle(body: undefined, context: Context): Promise<ApiResponse> {
        return {
            body: undefined,
        }
    }
}
