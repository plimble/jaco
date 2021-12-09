import {KinesisStreamEvent, SNSEvent, SQSEvent} from 'aws-lambda'
import {AppError, InternalError, Singleton} from '@onedaycat/jaco-common'
import {DomainEvent, ParsedDomainEvent} from './domain-event'

@Singleton()
export class DomainEventParser {
    onParseRequestError(err: AppError): any {
        return err
    }

    parseResponse(): void {
        return undefined
    }

    parseErrorResponse(err: AppError): any {
        return err
    }

    parseRequest(input: any): ParsedDomainEvent[] {
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

        // DomainEvent payload list
        if (Array.isArray(input) && input.length && input[0].event && input[0].seqNumber) {
            return input
        }

        throw new AppError(InternalError).withMessage('Unable to parse domain event').withInput(input)
    }

    private parseSns(input: SNSEvent): ParsedDomainEvent[] {
        return input.Records.map<ParsedDomainEvent>(rec => {
            return {event: JSON.parse(rec.Sns.Message) as DomainEvent, seqNumber: '0'}
        })
    }

    private parseKiesis(input: KinesisStreamEvent): ParsedDomainEvent[] {
        return input.Records.map<ParsedDomainEvent>(rec => {
            const body = new Buffer(rec.kinesis.data, 'base64')

            return {event: JSON.parse(body.toString()) as DomainEvent, seqNumber: rec.kinesis.sequenceNumber}
        })
    }

    private parseSqs(input: SQSEvent): ParsedDomainEvent[] {
        return input.Records.map<ParsedDomainEvent>(rec => {
            let payload = JSON.parse(rec.body)
            if (payload.Type && payload.Type === 'Notification') {
                payload = JSON.parse(payload.Message)
            }

            return {event: payload as DomainEvent, seqNumber: rec.attributes.SequenceNumber ?? '0'}
        })
    }
}
