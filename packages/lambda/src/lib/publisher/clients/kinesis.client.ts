import {ClientPublisher} from '../interfaces'
import Kinesis from 'aws-sdk/clients/kinesis'
import {chunkArray, Singleton} from '@plimble/jaco-common'
import {Kinesisx} from '@plimble/jaco-awsx'
import {Message} from '../message'

@Singleton()
export class KinesisClient implements ClientPublisher {
    private readonly streamName?: string

    constructor(private client: Kinesisx) {
        this.streamName = process.env.JACO_KINESIS_STREAM_NAME
    }

    async publish(messages: Array<Message>): Promise<void> {
        if (!this.streamName) return

        const chunkEvents = chunkArray(messages, 200)
        for (const batchEvents of chunkEvents) {
            if (!batchEvents.length) {
                continue
            }

            const params: Kinesis.PutRecordsInput = {
                Records: batchEvents.map(message => ({
                    Data: JSON.stringify(message),
                    PartitionKey: message.groupId() ?? message.id,
                })),
                StreamName: this.streamName,
            }

            await this.client.putRecords(params)
        }
    }
}
