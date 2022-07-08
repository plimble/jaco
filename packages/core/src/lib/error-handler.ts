import {AppError} from '@plimble/jaco-common'
import {Context} from './context'

export interface ErrorHandler {
    handle(err: AppError, context: Context): Promise<void>
}
