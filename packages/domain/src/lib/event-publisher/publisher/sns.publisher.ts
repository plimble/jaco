import {Publisher, SNSTarget} from '../interfaces'
import {DomainEvent} from '../../domain-event'
import {SNSX} from '../../services/snsx'
import {Singleton} from '@onedaycat/jaco-common'

const eventTypeKey = 'event'
const snsStringDataType = 'String'

@Singleton()
export class SNSPublisher implements Publisher {
    constructor(private client: SNSX) {}

    async publish(setup: SNSTarget, events: Array<DomainEvent>): Promise<void> {
        const records = events.map(e => {
            return this.client.publish({
                TopicArn: setup.topicArn,
                Message: JSON.stringify(e),
                MessageAttributes: {
                    [eventTypeKey]: {
                        DataType: snsStringDataType,
                        StringValue: e.type,
                    },
                },
            })
        })

        if (records.length) {
            await Promise.all(records)
        }
    }
}
