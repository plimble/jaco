import SNS from 'aws-sdk/clients/sns'
import {InternalError, Singleton, sleep} from '@onedaycat/jaco-common'

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
                    throw new InternalError().withCause(e).withInput(params)
                }
            }
        }

        throw new InternalError().withInput(params)
    }
}
