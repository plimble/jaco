import {BaseType, TypeName} from './base'

export class EnumType extends BaseType {
    type: TypeName = 'enum'
    values: string[] = []
    name = ''

    setName(name: string): this {
        this.name = name

        return this
    }

    setValues(vals: string[]): this {
        this.values = vals

        return this
    }

    toKotlinType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }

    toNodeType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }

    toSwiftType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }

    toDartType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }
}
