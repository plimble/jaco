import {Field} from '@plimble/jaco-validator'

export class Tag {
    @Field({type: 'string'})
    id = ''

    @Field({type: 'string'})
    name = ''
}
