import {BaseType, TypeName} from './base'

export class MoneyType extends BaseType {
    type: TypeName = 'money'

    toKotlinType(): string {
        return this.transform ? this.transform('Double') : 'Double'
    }

    toNodeType(): string {
        return this.transform ? this.transform('number') : 'number'
    }

    toSwiftType(): string {
        return this.transform ? this.transform('Double') : 'Double'
    }

    toDartType(): string {
        return this.transform ? this.transform('double') : 'double'
    }
}
