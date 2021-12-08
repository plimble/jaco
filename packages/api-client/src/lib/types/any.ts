import {BaseType, TypeName} from './base'

export class AnyType extends BaseType {
    type: TypeName = 'any'

    toKotlinType(): string {
        return this.transform ? this.transform('Any') : 'Any'
    }

    toNodeType(): string {
        return this.transform ? this.transform('any') : 'any'
    }

    toSwiftType(): string {
        return this.transform ? this.transform('Any') : 'Any'
    }

    toDartType(): string {
        return this.transform ? this.transform('dynamic') : 'dynamic'
    }
}

export const anyValue = new AnyType()
