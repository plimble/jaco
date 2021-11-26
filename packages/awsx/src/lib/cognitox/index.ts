import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'
import {InternalError, Singleton} from '@onedaycat/jaco-common'
import {AliasExists, UserNotFound} from './errors'

@Singleton()
export class Cognitox {
    client: CognitoIdentityServiceProvider

    constructor() {
        this.client = new CognitoIdentityServiceProvider()
    }

    /*
     * @throws AliasExistsException "cognito.AliasExists", "Email or phone number is already exist"
     * @throws UserNotFoundException "cognito.UserNotFound", "User not found"
     * */
    async updateEmail(poolId: string, id: string, email: string): Promise<void> {
        const params: CognitoIdentityServiceProvider.Types.AdminUpdateUserAttributesRequest = {
            Username: id,
            UserPoolId: poolId,
            UserAttributes: [
                {Name: 'email', Value: email},
                {Name: 'email_verified', Value: 'True'},
            ],
        }

        try {
            await this.client.adminUpdateUserAttributes(params).promise()
        } catch (e: any) {
            switch (e.code) {
                case 'AliasExists':
                    throw new AliasExists()
                case 'UserNotFound':
                    throw new UserNotFound()
                default:
                    throw new InternalError().withCause(e).withInput(params)
            }
        }
    }

    /*
     * @throws UserNotFoundException "cognito.UserNotFound", "User not found"
     * */
    async deleteAccount(poolId: string, id: string): Promise<void> {
        const params: CognitoIdentityServiceProvider.Types.AdminDeleteUserRequest = {
            Username: id,
            UserPoolId: poolId,
        }

        try {
            await this.client.adminDeleteUser(params).promise()
        } catch (e: any) {
            switch (e.code) {
                case 'UserNotFound':
                    throw new UserNotFound()
                default:
                    throw new InternalError().withCause(e).withInput(params)
            }
        }
    }
}
