import {container, Singleton, wrapError} from '@onedaycat/jaco-common'
import {Message} from './message'
import {KinesisClient} from './clients/kinesis.client'
import {SnsFifoClient} from './clients/sns-fifo.client'

export type PublisherType = 'kinesis' | 'sqs-fifo'

@Singleton()
export class Publisher {
    private readonly type: PublisherType

    constructor(type?: PublisherType) {
        this.type = type || 'sqs-fifo'
    }

    async publish(messages: Array<Message>): Promise<void> {
        try {
            if (messages.length) {
                if (this.type === 'sqs-fifo') {
                    return container.resolve(SnsFifoClient).publish(messages)
                } else if (this.type === 'kinesis') {
                    return container.resolve(KinesisClient).publish(messages)
                }
            }

            return Promise.resolve()
        } catch (e) {
            throw wrapError(e).withInput(messages)
        }
    }
}
