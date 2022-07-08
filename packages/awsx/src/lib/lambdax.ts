import Lambda from 'aws-sdk/clients/lambda'
import {AppError, Singleton} from '@plimble/jaco-common'

@Singleton()
export class Lambdax {
    client: Lambda

    constructor(client?: Lambda) {
        if (client) {
            this.client = client
        } else {
            this.client = new Lambda({
                maxRetries: 5,
            })
        }
    }

    async invoke<K>(funcName: string, req: any): Promise<K> {
        const params: Lambda.InvocationRequest = {
            FunctionName: funcName,
            Payload: JSON.stringify(req),
        }
        const res = await this.client.invoke(params).promise()
        let body: any = undefined
        if (res.Payload) {
            body = JSON.parse(res.Payload.toString('utf8'))
        }

        if (res.StatusCode && res.StatusCode !== 200) {
            throw new AppError(res.StatusCode, res.FunctionError as string, body?.message)
        }

        return body
    }

    async asyncInvoke(funcName: string, req: any): Promise<void> {
        const params: Lambda.InvocationRequest = {
            FunctionName: funcName,
            InvocationType: 'Event',
            Payload: JSON.stringify(req),
        }
        const res = await this.client.invoke(params).promise()
        let body: any = undefined
        if (res.Payload) {
            body = JSON.parse(res.Payload.toString('utf8'))
        }

        if (res.StatusCode && res.StatusCode !== 200) {
            throw new AppError(res.StatusCode, res.FunctionError as string, body?.message)
        }

        return body
    }
}
