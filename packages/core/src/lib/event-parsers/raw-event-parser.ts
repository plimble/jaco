import {EventParser} from 'packages/core/src/lib/event-parser'
import {AppError} from '@onedaycat/jaco-common'
import {Context} from '../context'

export class RawEventParser implements EventParser {
    parseRequest(event: any, context: Context): any {
        return event
    }

    onParseRequestError(err: AppError, context: Context): void {
        throw err
    }

    parseResponse(payload: any, context: Context): any {
        return payload
    }

    parseErrorResponse(err: AppError, context: Context): any {
        throw err
    }
}
