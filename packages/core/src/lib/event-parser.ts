import {AppError} from '@onedaycat/jaco-common'
import {Context} from './context'

export interface EventParser {
    parseRequest(event: any, context: Context): any
    onParseRequestError(err: AppError, context: Context): any
    parseResponse(payload: any, context: Context): any
    parseErrorResponse(err: AppError, context: Context): any
}
