import {AppError} from '@onedaycat/jaco-common'
import {EventParser} from './resolve-event-parser'

export class RawParser {
    static onParseRequestError(err: AppError): any {
        return err
    }

    static parseErrorResponse(err: AppError): any {
        return err
    }

    static parseRequest(event: any): any {
        return event
    }

    static parseResponse(payload: any): any {
        return payload
    }

    static resolve(): EventParser | undefined {
        return RawParser
    }
}
