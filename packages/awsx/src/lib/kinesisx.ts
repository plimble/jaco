import Kinesis from 'aws-sdk/clients/kinesis'
import {InternalError, Singleton} from '@onedaycat/jaco-common'

@Singleton()
export class Kinesisx {
    client: Kinesis

    constructor(client?: Kinesis) {
        if (client) {
            this.client = client
        } else {
            this.client = new Kinesis({
                maxRetries: 5,
            })
        }
    }

    async putRecords(params: Kinesis.PutRecordsInput): Promise<Kinesis.PutRecordsOutput> {
        try {
            return await this.client.putRecords(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }
}
