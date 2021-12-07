import {BaseType, TypeName} from './base'
import {anyValue} from './any'

export class ArrayType extends BaseType {
    public type: TypeName = 'array'
    public items: BaseType = anyValue

    public setItems(items: BaseType): this {
        this.items = items

        return this
    }

    public toKotlinType(): string {
        return `List<${this.items.toKotlinType()}>`
    }

    public toNodeType(): string {
        return `${this.items.toNodeType()}[]`
    }

    public toSwiftType(): string {
        return `[${this.items.toSwiftType()}]`
    }

    public toDartType(): string {
        return `List<${this.items.toDartType()}>`
    }
}
