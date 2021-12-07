import {BaseType, TypeName} from './base'

export class DecimalType extends BaseType {
    public type: TypeName = 'decimal'
    public precision = 2

    public setPrecision(precison: number): this {
        this.precision = precison

        return this
    }

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
