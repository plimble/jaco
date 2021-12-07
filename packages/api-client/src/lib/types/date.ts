import {BaseType, TypeName} from './base'

export class DateType extends BaseType {
    public type: TypeName = 'date'

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
