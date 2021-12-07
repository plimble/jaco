import {IsDefined, IsEnum, IsNumber, IsString, ValidateNested} from 'class-validator'
import {Profile} from './profile'
import {Type} from 'class-transformer'
import {FieldInfo} from '@onedaycat/jaco'

export enum AccountType {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

@FieldInfo({
    description: 'Account model',
})
export class Account {
    @IsString()
    @IsEnum(['1', '2'])
    id = ''

    @IsString()
    name = ''

    @IsNumber()
    @FieldInfo({
        format: 'timestamp',
    })
    createdAt = 0

    @Type(() => Profile)
    @ValidateNested()
    profile: Profile = new Profile()

    @IsEnum(AccountType)
    type: AccountType = AccountType.USER

    @FieldInfo({
        deprecated: true,
    })
    @IsDefined()
    deprecated: any
}
