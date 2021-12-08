import {Profile} from './profile'
import {Schema, Validate} from '@onedaycat/jaco-validator'

export enum AccountType {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

@Validate({
    description: 'Account model',
})
export class Account {
    @Schema({type: 'string', enum: ['1', '2']})
    id = ''

    @Schema({type: 'string'})
    name = ''

    @Schema({type: 'number', format: 'timestamp'})
    createdAt = 0

    @Schema({type: 'object', ref: Profile})
    profile: Profile = new Profile()

    @Schema({type: 'string', enum: AccountType})
    type: AccountType = AccountType.USER

    @Schema({type: 'any', deprecated: true})
    deprecated: any
}
