import {AppError} from '@plimble/jaco-common'
import {MessagePayload, ReactorMessage} from '../publisher/message'
import {SNSEvent} from 'aws-lambda'
import {EventParser} from './resolve-event-parser'

export class SNSParser {
    static onParseRequestError(err: AppError): any {
        return err
    }

    static parseErrorResponse(err: AppError): any {
        return err
    }

    static parseRequest(event: SNSEvent): ReactorMessage[] {
        return event.Records.map<ReactorMessage>(rec => {
            return {message: JSON.parse(rec.Sns.Message) as MessagePayload, seqNumber: '0'}
        })
    }

    static parseResponse(): any {
        return undefined
    }

    static resolve(event: any): EventParser | undefined {
        if (event.Records && event.Records.length && event.Records[0].Sns) {
            return SNSParser
        }

        return undefined
    }
}
