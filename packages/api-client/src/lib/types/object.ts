import {BaseType, TypeName} from './base'
import {EnumType} from './enum'
import {ArrayType} from './array'
import {MapType} from './map'

export type ObjectKind = 'input' | 'output' | 'model' | 'object'

export class ObjectType extends BaseType {
    type: TypeName = 'object'
    kind: ObjectKind = 'object'
    fields: Record<string, BaseType> = {}
    name = ''
    dependencies: BaseType[] = []

    setName(name: string): this {
        this.name = name

        return this
    }

    setKind(kind: ObjectKind): this {
        this.kind = kind

        return this
    }

    setFields(fields: Record<string, BaseType>): this {
        this.fields = fields

        for (const field of Object.values(fields)) {
            this.depField(field)
        }

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
