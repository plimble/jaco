import {BaseType, TypeName} from './base'

export class AnyType extends BaseType {
    public type: TypeName = 'any'

    public toKotlinType(): string {
        return this.transform ? this.transform('Any') : 'Any'
    }

    public toNodeType(): string {
        return this.transform ? this.transform('any') : 'any'
    }

    public toSwiftType(): string {
        return this.transform ? this.transform('Any') : 'Any'
    }

    public toDartType(): string {
        return this.transform ? this.transform('dynamic') : 'dynamic'
    }
}

export const anyValue = new AnyType()
