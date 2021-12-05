import {KinesisTarget, Publisher} from '../interfaces'
import Kinesis from 'aws-sdk/clients/kinesis'
import {chunkArray, Singleton} from '@onedaycat/jaco-common'
import {Kinesisx} from '@onedaycat/jaco-awsx'
import {DomainEvent} from '../../ddd/domain-event'

@Singleton()
export class KinesisPublisher implements Publisher {
    constructor(private client: Kinesisx) {}

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

    async publish(setup: KinesisTarget, events: Array<DomainEvent>, groupId?: string): Promise<void> {
        const chunkEvents = chunkArray(events, 200)
        for (const batchEvents of chunkEvents) {
            if (!batchEvents.length) {
                continue
            }

            const params: Kinesis.PutRecordsInput = {
                Records: batchEvents.map(e => ({
                    Data: JSON.stringify(e),
                    PartitionKey: KinesisPublisher.getGroupId(e, setup.groupKey, groupId),
                })),
                StreamName: setup.streamName,
            }

            await this.client.putRecords(params)
        }
    }
}
