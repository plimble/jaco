import {Api, ApiResponse, Context, Controller} from '@onedaycat/jaco'
import {Profile} from './model/profile'

@Api({
    input: Profile,
    output: Profile,
})
export class Ctrl2 extends Controller {
    async handle(body: undefined, context: Context): Promise<ApiResponse> {
        return {
            body: undefined,
        }
    }
}
