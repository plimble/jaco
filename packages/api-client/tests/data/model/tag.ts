import {Schema, Validate} from '@onedaycat/jaco-validator'

@Validate()
export class Tag {
    @Schema({type: 'string'})
    id = ''

    @Schema({type: 'string'})
    name = ''
}
