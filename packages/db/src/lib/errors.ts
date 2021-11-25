import {AppError} from '@onedaycat/jaco-common'

export class TransactionCanceled extends AppError {
    constructor(message?: string) {
        super(500, 'TransactionCanceled', message ?? 'Transaction canceled')
    }
}
