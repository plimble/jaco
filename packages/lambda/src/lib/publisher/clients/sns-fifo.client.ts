import {ClientPublisher} from '../interfaces'
import {Singleton} from '@plimble/jaco-common'
import {SNSX} from '@plimble/jaco-awsx'
import {Message} from '../message'

const eventTypeKey = 'event'
const snsStringDataType = 'String'

@Singleton()
export class SnsFifoClient implements ClientPublisher {
    private readonly arn?: string

    constructor(private client: SNSX) {
        this.arn = process.env.JACO_SNS_FIFO_ARN
    }

    async publish(messages: Array<Message>): Promise<void> {
        if (!this.arn) return

        for (const message of messages) {
            await this.client.publish({
                TopicArn: this.arn,
                Message: JSON.stringify(message),
                MessageAttributes: {
                    [eventTypeKey]: {
                        DataType: snsStringDataType,
                        StringValue: message.type,
                    },
                },
                MessageGroupId: message.groupId() ?? message.id,
            })
        }
    }
}
