import {Field} from '@onedaycat/jaco-validator'

export class Tag {
    @Field({type: 'string'})
    id = ''

    @Field({type: 'string'})
    name = ''
}
