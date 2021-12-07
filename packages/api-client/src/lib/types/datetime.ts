import {BaseType, TypeName} from './base'

export class DateTimeType extends BaseType {
    public type: TypeName = 'datetime'

    public toKotlinType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    public toNodeType(): string {
        return this.transform ? this.transform('String') : 'string'
    }

    public toSwiftType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    public toDartType(): string {
        return this.transform ? this.transform('String') : 'String'
    }
}
