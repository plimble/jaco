import {BaseType, TypeName} from './base'
import {EnumType} from './enum'
import {ArrayType} from './array'
import {MapType} from './map'

export type ObjectKind = 'input' | 'output' | 'model' | 'object'

export class ObjectType extends BaseType {
    public type: TypeName = 'object'
    public kind: ObjectKind = 'object'
    public fields: Record<string, BaseType> = {}
    public name = ''
    public dependencies: BaseType[] = []

    public setName(name: string): this {
        this.name = name

        return this
    }

    public setKind(kind: ObjectKind): this {
        this.kind = kind

        return this
    }

    public setFields(fields: Record<string, BaseType>): this {
        this.fields = fields

        for (const field of Object.values(fields)) {
            this.depField(field)
        }

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

    private depField(field: BaseType): void {
        if (field.isType(ObjectType) && field.name !== this.name) {
            this.dependencies.push(field)
        } else if (field.isType(EnumType)) {
            this.dependencies.push(field)
        } else if (field.isType(ArrayType)) {
            this.depField(field.items)
        } else if (field.isType(MapType)) {
            this.depField(field.key)
            this.depField(field.value)
        }
    }
}
