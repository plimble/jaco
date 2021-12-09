import {Tag} from './tag'
import {Field} from '@onedaycat/jaco-validator'

export class Profile {
    @Field({type: 'string'})
    email = ''

    @Field({type: 'number', optional: true})
    mobile?: number

    @Field({type: 'boolean'})
    isPublic = false

    @Field({type: 'array', items: {type: 'object', ref: Tag}})
    tags: Tag[] = []

    @Field({type: 'array', items: {type: 'string'}})
    addresses: string[] = []
}
