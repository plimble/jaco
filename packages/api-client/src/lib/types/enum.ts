import {BaseType, TypeName} from './base'

export class EnumType extends BaseType {
    public type: TypeName = 'enum'
    public values: string[] = []
    public name = ''

    public setName(name: string): this {
        this.name = name

        return this
    }

    public setValues(vals: string[]): this {
        this.values = vals

        return this
    }

    public toKotlinType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }

    public toNodeType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }

    public toSwiftType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }

    public toDartType(): string {
        return this.transform ? this.transform(this.name) : this.name
    }
}
