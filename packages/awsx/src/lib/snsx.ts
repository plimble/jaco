import SNS from 'aws-sdk/clients/sns'
import {AppError, InternalError, Singleton, sleep} from '@plimble/jaco-common'

@Singleton()
export class SNSX {
    client: SNS

    constructor(client?: SNS) {
        if (client) {
            this.client = client
        } else {
            this.client = new SNS({
                maxRetries: 50,
            })
        }
    }

    async publish(params: SNS.PublishInput): Promise<SNS.PublishResponse> {
        while (Boolean) {
            try {
                return await this.client.publish(params).promise()
            } catch (e: any) {
                if (e.message === 'Rate exceeded') {
                    await sleep(100)
                } else {
                    throw new AppError(InternalError).withCause(e).withInput(params)
                }
            }
        }

        throw new AppError(InternalError).withInput(params)
    }
}
