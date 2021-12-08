import {BaseType, TypeName} from './base'

export class DateTimeType extends BaseType {
    type: TypeName = 'datetime'

    toKotlinType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    toNodeType(): string {
        return this.transform ? this.transform('String') : 'string'
    }

    toSwiftType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    toDartType(): string {
        return this.transform ? this.transform('String') : 'String'
    }
}
