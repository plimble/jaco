import {Profile} from './profile'
import {Field} from '@plimble/jaco-validator'

export enum AccountType {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export class Account {
    @Field({type: 'string', enum: ['1', '2']})
    id = ''

    @Field({type: 'string'})
    name = ''

    @Field({type: 'number', format: 'timestamp'})
    createdAt = 0

    @Field({type: 'object', ref: Profile})
    profile: Profile = new Profile()

    @Field({type: 'string', enum: AccountType})
    type: AccountType = AccountType.USER

    @Field({type: 'any', deprecated: true})
    deprecated: any
}
