import {Api, Context, Controller, HttpRes} from '@plimble/jaco-core'
import {Profile} from './model/profile'
import {Maintenance} from '@plimble/jaco-common'

@Api({
    input: Profile,
    output: Profile,
    errors: [Maintenance],
})
export class Ctrl2 implements Controller {
    async handle(body: undefined, context: Context): Promise<HttpRes> {
        return {
            body: undefined,
        }
    }
}
