import {AppError} from '@plimble/jaco-common'
import {MessagePayload, ReactorMessage} from '../publisher/message'
import {SQSEvent} from 'aws-lambda'
import {EventParser} from './resolve-event-parser'

export class SQSParser {
    static onParseRequestError(err: AppError): any {
        return err
    }

    static parseErrorResponse(err: AppError): any {
        return err
    }

    static parseRequest(event: SQSEvent): ReactorMessage[] {
        return event.Records.map<ReactorMessage>(rec => {
            let payload = JSON.parse(rec.body)
            if (payload.Type && payload.Type === 'Notification') {
                payload = JSON.parse(payload.Message)
            }

            return {message: payload as MessagePayload, seqNumber: rec.attributes.SequenceNumber ?? '0'}
        })
    }

    static parseResponse(): any {
        return undefined
    }

    static resolve(event: any): EventParser | undefined {
        if (event.Records && event.Records.length && event.Records[0].body && event.Records[0].messageId) {
            return SQSParser
        }

        return undefined
    }
}
