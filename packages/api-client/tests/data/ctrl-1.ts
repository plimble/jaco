import {Api, ApiResponse, Context, Controller} from '@onedaycat/jaco'
import {Account} from './model/account'

@Api({
    input: Account,
    output: Account,
})
export class Ctrl1 extends Controller {
    async handle(body: undefined, context: Context): Promise<ApiResponse> {
        return {
            body: undefined,
        }
    }
}
