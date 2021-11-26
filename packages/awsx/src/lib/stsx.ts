import STS from 'aws-sdk/clients/sts'
import {InternalError, Singleton} from '@onedaycat/jaco-common'

@Singleton()
export class STSX {
    client: STS

    constructor() {
        this.client = new STS({
            maxRetries: 5,
        })
    }

    async assumeRole(params: STS.Types.AssumeRoleRequest): Promise<STS.Types.AssumeRoleResponse> {
        try {
            return await this.client.assumeRole(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async assumeRoleWithWebIdentity(
        params: STS.Types.AssumeRoleWithWebIdentityRequest,
    ): Promise<STS.Types.AssumeRoleWithWebIdentityResponse> {
        try {
            return await this.client.assumeRoleWithWebIdentity(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }
}
