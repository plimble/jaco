import {BaseType, TypeName} from './base'

export class BooleanType extends BaseType {
    type: TypeName = 'boolean'

    toKotlinType(): string {
        return this.transform ? this.transform('Boolean') : 'Boolean'
    }

    toNodeType(): string {
        return this.transform ? this.transform('boolean') : 'boolean'
    }

    toSwiftType(): string {
        return this.transform ? this.transform('Bool') : 'Bool'
    }

    toDartType(): string {
        return this.transform ? this.transform('bool') : 'bool'
    }
}
