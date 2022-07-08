import Kinesis from 'aws-sdk/clients/kinesis'
import {AppError, InternalError, Singleton} from '@plimble/jaco-common'

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
            throw new AppError(InternalError).withCause(e).withInput(params)
        }
    }
}
