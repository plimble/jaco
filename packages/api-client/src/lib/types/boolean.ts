import {BaseType, TypeName} from './base'

export class BooleanType extends BaseType {
    public type: TypeName = 'boolean'

    public toKotlinType(): string {
        return this.transform ? this.transform('Boolean') : 'Boolean'
    }

    public toNodeType(): string {
        return this.transform ? this.transform('boolean') : 'boolean'
    }

    public toSwiftType(): string {
        return this.transform ? this.transform('Bool') : 'Bool'
    }

    public toDartType(): string {
        return this.transform ? this.transform('bool') : 'bool'
    }
}
