import {Publisher, SNSFifoTarget} from '../interfaces'
import {DomainEvent} from '../../domain-event'
import {SNSX} from '../../services/snsx'
import {Singleton} from '@onedaycat/jaco-common'

const eventTypeKey = 'event'
const snsStringDataType = 'String'

@Singleton()
export class SnsFifoPublisher implements Publisher {
    constructor(private client: SNSX) {}

    private static getGroupId(event: DomainEvent, groupKey?: string, groupId?: string): string {
        if (groupId) {
            return groupId
        }

        if (!groupKey) {
            return event.id
        }

        const key = event.payload[groupKey]
        if (key === '' || key == null) {
            return event.id
        }

        return key
    }

    async publish(setup: SNSFifoTarget, events: Array<DomainEvent>, groupId?: string): Promise<void> {
        for (const event of events) {
            await this.client.publish({
                TopicArn: setup.topicArn,
                Message: JSON.stringify(event),
                MessageAttributes: {
                    [eventTypeKey]: {
                        DataType: snsStringDataType,
                        StringValue: event.type,
                    },
                },
                MessageGroupId: SnsFifoPublisher.getGroupId(event, setup.groupKey, groupId),
            })
        }
    }
}
