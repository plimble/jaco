import {IsString} from 'class-validator'

export class Tag {
    @IsString()
    id = ''

    @IsString()
    name = ''
}
