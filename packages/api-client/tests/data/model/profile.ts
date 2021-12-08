import {Tag} from './tag'
import {Schema, Validate} from '@onedaycat/jaco-validator'

@Validate()
export class Profile {
    @Schema({type: 'string'})
    email = ''

    @Schema({type: 'number', optional: true})
    mobile?: number

    @Schema({type: 'boolean'})
    isPublic = false

    @Schema({type: 'array', items: {type: 'object', ref: Tag}})
    tags: Tag[] = []

    @Schema({type: 'array', items: {type: 'string'}})
    addresses: string[] = []
}
