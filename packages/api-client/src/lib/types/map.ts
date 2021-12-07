import {BaseType, TypeName} from './base'
import {anyValue} from './any'

export class MapType extends BaseType {
    public type: TypeName = 'map'
    public key: BaseType = anyValue
    public value: BaseType = anyValue

    public setKey(key: BaseType): this {
        this.key = key

        return this
    }

    public setValue(value: BaseType): this {
        this.value = value

        return this
    }

    public toKotlinType(): string {
        return `Map<${this.key.toKotlinType()}, ${this.value.toKotlinType()}>`
    }

    public toNodeType(): string {
        return `Record<${this.key.toNodeType()}, ${this.value.toNodeType()}>`
    }

    public toSwiftType(): string {
        return `[${this.key.toSwiftType()}: ${this.value.toSwiftType()}]`
    }

    public toDartType(): string {
        return `Map<${this.key.toDartType()}, ${this.value.toDartType()}>`
    }
}
