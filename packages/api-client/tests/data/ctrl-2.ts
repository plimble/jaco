import {Api, ApiResponse, Context, Controller} from '@onedaycat/jaco'
import {Profile} from './model/profile'
import {Maintenance} from '@onedaycat/jaco-common'

@Api({
    input: Profile,
    output: Profile,
    errors: [Maintenance],
})
export class Ctrl2 extends Controller {
    async handle(body: undefined, context: Context): Promise<ApiResponse> {
        return {
            body: undefined,
        }
    }
}
