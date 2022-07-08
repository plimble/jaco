import SQS from 'aws-sdk/clients/sqs'
import {AppError, InternalError, Singleton} from '@plimble/jaco-common'

@Singleton()
export class SQSX {
    client: SQS

    constructor(client?: SQS) {
        if (client) {
            this.client = client
        } else {
            this.client = new SQS({
                maxRetries: 50,
            })
        }
    }

    async sendMessage(params: SQS.SendMessageRequest): Promise<SQS.SendMessageResult> {
        try {
            return await this.client.sendMessage(params).promise()
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput(params)
        }
    }

    async sendMessageBatch(params: SQS.SendMessageBatchRequest): Promise<SQS.SendMessageBatchResult> {
        try {
            return await this.client.sendMessageBatch(params).promise()
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput(params)
        }
    }
}
