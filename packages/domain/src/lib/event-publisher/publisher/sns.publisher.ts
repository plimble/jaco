import {Publisher, SNSTarget} from '../interfaces'
import {Singleton} from '@onedaycat/jaco-common'
import {SNSX} from '@onedaycat/jaco-awsx'
import {DomainEvent} from '../../ddd/domain-event'

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
