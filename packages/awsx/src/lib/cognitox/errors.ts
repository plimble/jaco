import {AppError} from '@plimble/jaco-common'

export class UserNotFound extends AppError {
    constructor() {
        super(400, 'UserNotFound', 'Transaction canceled')
    }
}

export class AliasExists extends AppError {
    constructor() {
        super(400, 'AliasExists', 'Email or phone number is already exist')
    }
}
