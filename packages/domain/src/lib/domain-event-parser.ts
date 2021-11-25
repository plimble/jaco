import {KinesisStreamEvent, SNSEvent, SQSEvent} from 'aws-lambda'
import {InternalError, Singleton} from '@onedaycat/jaco-common'
import {DomainEvent, DomainEventPayload} from './domain-event'

@Singleton()
export class DomainEventParser {
    parse(input: any): DomainEvent[] {
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

        if (Array.isArray(input) && input.length && input[0] instanceof DomainEvent) {
            return input
        }

        // DomainEvent payload list
        if (Array.isArray(input) && input.length && input[0].id && input[0].payload && input[0].type) {
            return this.parseDomainEventPayload(input)
        }

        throw new InternalError('Unable to parse domain event').withInput(input)
    }

    private parseSns(input: SNSEvent): DomainEvent[] {
        return input.Records.map<DomainEvent>(rec => {
            const payload = JSON.parse(rec.Sns.Message)

            return DomainEvent.loadFromPayload(payload)
        })
    }

    private parseKiesis(input: KinesisStreamEvent): DomainEvent[] {
        return input.Records.map<DomainEvent>(rec => {
            const body = new Buffer(rec.kinesis.data, 'base64')

            return DomainEvent.loadFromPayload(JSON.parse(body.toString()), rec.kinesis.sequenceNumber)
        })
    }

    private parseSqs(input: SQSEvent): DomainEvent[] {
        return input.Records.map<DomainEvent>(rec => {
            let payload = JSON.parse(rec.body)
            if (payload.Type && payload.Type === 'Notification') {
                payload = JSON.parse(payload.Message)
            }

            return DomainEvent.loadFromPayload(payload, rec.attributes.SequenceNumber)
        })
    }

    private parseDomainEventPayload(input: Array<DomainEventPayload | DomainEvent>): DomainEvent[] {
        return input.map<DomainEvent>(rec => {
            if (rec instanceof DomainEvent) {
                return rec
            }

            return DomainEvent.loadFromPayload(rec)
        })
    }
}
