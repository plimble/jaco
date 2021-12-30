import {KinesisStreamEvent, SNSEvent, SQSEvent} from 'aws-lambda'
import {AppError, InternalError, Singleton} from '@onedaycat/jaco-common'
import {MessagePayload, ReactorMessage} from '../publisher/message'

@Singleton()
export class MessageParser {
    onParseRequestError(err: AppError): any {
        return err
    }

    parseResponse(): void {
        return undefined
    }

    parseErrorResponse(err: AppError): any {
        return err
    }

    parseRequest(input: any): ReactorMessage[] {
        // Kinesis
        if (input.Records && input.Records.length && input.Records[0].kinesis) {
            return this.parseKiesis(input)
        }

        // SNS
        if (input.Records && input.Records.length && input.Records[0].Sns) {
            return this.parseSns(input)
        }

        // SQS
        if (input.Records && input.Records.length && input.Records[0].body && input.Records[0].messageId) {
            return this.parseSqs(input)
        }

        // Message payload list
        if (Array.isArray(input) && input.length && input[0].message && input[0].seqNumber) {
            return input
        }

        throw new AppError(InternalError).withMessage('Unable to parse message').withInput(input)
    }

    private parseSns(input: SNSEvent): ReactorMessage[] {
        return input.Records.map<ReactorMessage>(rec => {
            return {message: JSON.parse(rec.Sns.Message) as MessagePayload, seqNumber: '0'}
        })
    }

    private parseKiesis(input: KinesisStreamEvent): ReactorMessage[] {
        return input.Records.map<ReactorMessage>(rec => {
            const body = new Buffer(rec.kinesis.data, 'base64')

            return {message: JSON.parse(body.toString()) as MessagePayload, seqNumber: rec.kinesis.sequenceNumber}
        })
    }

    private parseSqs(input: SQSEvent): ReactorMessage[] {
        return input.Records.map<ReactorMessage>(rec => {
            let payload = JSON.parse(rec.body)
            if (payload.Type && payload.Type === 'Notification') {
                payload = JSON.parse(payload.Message)
            }

            return {message: payload as MessagePayload, seqNumber: rec.attributes.SequenceNumber ?? '0'}
        })
    }
}
