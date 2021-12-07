import {
    AnyType,
    ArrayType,
    BaseType,
    BooleanType,
    DecimalType,
    EnumType,
    MapType,
    MoneyType,
    NumberType,
    ObjectType,
    StringType,
    TimestampType,
} from './types'
import {SchemaObject} from 'openapi3-ts'
import {ReferenceObject} from 'openapi3-ts/src/model/OpenApi'

export class TypeParser<T extends BaseType = BaseType> {
    public root: T
    public refs: Record<string, BaseType> = {}
    public dependencies: Record<string, BaseType>
    private readonly jsonSchema: Record<string, SchemaObject>

    constructor(objectName: string, jsonSchema: Record<string, SchemaObject>) {
        this.jsonSchema = jsonSchema
        const ref = {
            $ref: objectName,
        }

        this.root = this.parse(ref) as any
        this.dependencies = this.rootDependency(this.root)
    }

    private parse(schema: SchemaObject | ReferenceObject): BaseType {
        if (schema.$ref) {
            return this.parseObject(schema as ReferenceObject)
        } else {
            const schemaObject = schema as SchemaObject
            const type = schemaObject.format ?? schemaObject.type ?? 'null'

            switch (type) {
                case 'enum':
                    return this.parseEnum(schema)
                case 'timestamp':
                    return this.parseTimestamp(schema)
                case 'money':
                    return this.parseMoney(schema)
                case 'decimal':
                    return this.parseDecimal(schema)
                case 'any':
                    return this.parseAny(schema)
                case 'array':
                    return this.parseArray(schema)
                case 'boolean':
                    return this.parseBoolean(schema)
                case 'string':
                    return this.parseString(schema)
                case 'number':
                    return this.parseNumber(schema)
                case 'null':
                    return new AnyType()
            }
        }

        return new AnyType()
    }

    private parseObject(refSchema: ReferenceObject): ObjectType {
        const name = refSchema.$ref.split('/').pop() as string
        const schema = this.findSchema(refSchema.$ref)

        const fields: Record<string, BaseType> = {}
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, subSchema]) => {
                const subType = this.parse(subSchema) as BaseType
                subType.setOptional(this.getOptional(key, schema))
                fields[key] = subType
                if (schema.$ref) {
                    this.setRef(subType)
                }
            })
        }

        return new ObjectType()
            .setKind('model')
            .setName(name)
            .setDoc({desc: schema.description})
            .setOptional(this.getOptional(name, schema))
            .setFields(fields)
    }

    private parseArray(schema: SchemaObject): ArrayType {
        const items = this.parse(schema.items as SchemaObject) as any
        this.setRef(items)

        return new ArrayType().setItems(items).setDoc({desc: flags.description})
    }

    private parseString(schema: SchemaObject): StringType {
        const validValues = this.getValidValues(describer.allow)

        return new StringType()
            .setDoc({desc: flags.description, validValues})
            .setValues(validValues)
            .setOptional(this.getOptional(flags))
    }

    private parseNumber(describer: Joi.Description): NumberType {
        const flags: any = describer.flags ?? {}

        return new NumberType().setDoc({desc: flags.description}).setOptional(this.getOptional(flags))
    }

    private parseAny(describer: Joi.Description): AnyType {
        const flags: any = describer.flags ?? {}

        return new AnyType().setDoc({desc: flags.description}).setOptional(this.getOptional(flags))
    }

    private parseBoolean(describer: Joi.Description): BooleanType {
        const flags: any = describer.flags ?? {}

        return new BooleanType().setDoc({desc: flags.description}).setOptional(this.getOptional(flags))
    }

    private parseDecimal(describer: Joi.Description): DecimalType {
        const flags: any = describer.flags ?? {}

        return new DecimalType()
            .setPrecision(flags.precision)
            .setDoc({desc: flags.description})
            .setOptional(this.getOptional(flags))
    }

    private parseEnum(describer: Joi.Description): EnumType {
        const flags: any = describer.flags ?? {}

        const enums = new EnumType()
            .setName(flags.name)
            .setValues(this.getValidValues(describer.allow) ?? [])
            .setDoc({desc: flags.description})
            .setOptional(this.getOptional(flags))

        this.setRef(enums)

        return enums
    }

    private parseMoney(describer: Joi.Description): MoneyType {
        const flags: any = describer.flags ?? {}

        return new MoneyType().setDoc({desc: flags.description}).setOptional(this.getOptional(flags))
    }

    private parseTimestamp(describer: Joi.Description): TimestampType {
        const flags: any = describer.flags ?? {}

        return new TimestampType().setDoc({desc: flags.description}).setOptional(this.getOptional(flags))
    }

    private rootDependency(root: BaseType): Record<string, BaseType> {
        const deps: Record<string, BaseType> = {}
        if (root instanceof ObjectType) {
            Object.values(root.fields)
                .filter((field: any) => {
                    return field['name'] != null
                })
                .forEach((field: any) => {
                    deps[field['name']] = field
                })
        }

        if (root instanceof ArrayType) {
            if ((root.items as any)['name']) {
                deps[(root.items as any)['name']] = root.items
            }
        }

        if (root instanceof MapType) {
            if ((root.key as any)['name']) {
                deps[(root.key as any)['name']] = root.key
            }
            if ((root.key as any)['name']) {
                deps[(root.key as any)['name']] = root.value
            }
        }

        return deps
    }

    private getOptional(name: string, schema: SchemaObject): boolean {
        if (schema.required) {
            return schema.required.includes(name)
        }

        return false
    }

    private setRef(type: BaseType): void {
        if ((type as any)['name']) {
            this.refs[(type as any)['name']] = type
        }
    }

    private getValidValues(values: string[] | undefined): string[] | undefined {
        if (!values) {
            return undefined
        }

        const vals = values.filter(s => s != null)

        return vals.length ? vals : undefined
    }

    private findSchema(type: string): SchemaObject {
        const typeName = type.split('/').pop() as string
        const schema = this.jsonSchema[typeName]
        if (!schema) {
            throw new Error(`Schema not found for type ${typeName}`)
        }

        return schema
    }
}
