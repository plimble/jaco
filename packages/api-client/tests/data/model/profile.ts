import {IsBoolean, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator'
import {Tag} from './tag'
import {Type} from 'class-transformer'

export class Profile {
    @IsString()
    email = ''

    @IsNumber()
    @IsOptional()
    mobile?: number

    @IsBoolean()
    isPublic = false

    @ValidateNested({each: true})
    @Type(() => Tag)
    tags: Tag[] = []

    @IsString({each: true})
    addresses: string[] = []
}
