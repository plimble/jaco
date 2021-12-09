import {AppError} from '@onedaycat/jaco-common'
import {Context} from '../context'
import {EventParser} from '../event-parser'

export class RawEventParser implements EventParser {
    parseRequest(event: any, context: Context): any {
        return event
    }

    onParseRequestError(err: AppError, context: Context): any {
        return err
    }

    parseResponse(payload: any, context: Context): any {
        return payload
    }

    parseErrorResponse(err: AppError, context: Context): any {
        return err
    }
}
