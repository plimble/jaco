import {BaseType, TypeName} from './base'

export class MoneyType extends BaseType {
    public type: TypeName = 'money'

    public toKotlinType(): string {
        return this.transform ? this.transform('Double') : 'Double'
    }

    public toNodeType(): string {
        return this.transform ? this.transform('number') : 'number'
    }

    public toSwiftType(): string {
        return this.transform ? this.transform('Double') : 'Double'
    }

    public toDartType(): string {
        return this.transform ? this.transform('double') : 'double'
    }
}
