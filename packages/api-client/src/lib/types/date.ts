import {BaseType, TypeName} from './base'

export class DateType extends BaseType {
    type: TypeName = 'date'

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
