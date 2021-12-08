import {BaseType, TypeName} from './base'
import {anyValue} from './any'

export class ArrayType extends BaseType {
    type: TypeName = 'array'
    items: BaseType = anyValue

    setItems(items: BaseType): this {
        this.items = items

        return this
    }

    toKotlinType(): string {
        return `List<${this.items.toKotlinType()}>`
    }

    toNodeType(): string {
        return `${this.items.toNodeType()}[]`
    }

    toSwiftType(): string {
        return `[${this.items.toSwiftType()}]`
    }

    toDartType(): string {
        return `List<${this.items.toDartType()}>`
    }
}
