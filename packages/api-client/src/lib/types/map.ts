import {BaseType, TypeName} from './base'
import {anyValue} from './any'

export class MapType extends BaseType {
    type: TypeName = 'map'
    key: BaseType = anyValue
    value: BaseType = anyValue

    setKey(key: BaseType): this {
        this.key = key

        return this
    }

    setValue(value: BaseType): this {
        this.value = value

        return this
    }

    toKotlinType(): string {
        return `Map<${this.key.toKotlinType()}, ${this.value.toKotlinType()}>`
    }

    toNodeType(): string {
        return `Record<${this.key.toNodeType()}, ${this.value.toNodeType()}>`
    }

    toSwiftType(): string {
        return `[${this.key.toSwiftType()}: ${this.value.toSwiftType()}]`
    }

    toDartType(): string {
        return `Map<${this.key.toDartType()}, ${this.value.toDartType()}>`
    }
}
