import {AppError} from '@plimble/jaco-common'
import {MessagePayload, ReactorMessage} from '../publisher/message'
import {KinesisStreamEvent} from 'aws-lambda'
import {EventParser} from './resolve-event-parser'

export class KinesisParser {
    static onParseRequestError(err: AppError): any {
        return err
    }

    static parseErrorResponse(err: AppError): any {
        return err
    }

    static parseRequest(event: KinesisStreamEvent): ReactorMessage[] {
        return event.Records.map<ReactorMessage>(rec => {
            const body = new Buffer(rec.kinesis.data, 'base64')

            return {message: JSON.parse(body.toString()) as MessagePayload, seqNumber: rec.kinesis.sequenceNumber}
        })
    }

    static parseResponse(): any {
        return undefined
    }

    static resolve(event): EventParser | undefined {
        if (event.Records && event.Records.length && event.Records[0].kinesis) {
            return KinesisParser
        }

        return undefined
    }
}
