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
import {Constructor} from '@onedaycat/jaco-common'

export class TypeParser {
    root: ObjectType
    rootName: string
    objects = new Map<string, ObjectType>()
    enums = new Map<string, EnumType>()

    constructor(schema: Record<string, any>) {
        this.rootName = schema.ref.name
        this.root = this.parse(schema) as any
    }

    private static parseNumber(schema: Record<string, any>): NumberType {
        return new NumberType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private static parseAny(schema: Record<string, any>): AnyType {
        return new AnyType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private static parseBoolean(schema: Record<string, any>): BooleanType {
        return new BooleanType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private static parseDecimal(schema: Record<string, any>): DecimalType {
        return new DecimalType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private static parseMoney(schema: Record<string, any>): MoneyType {
        return new MoneyType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private static parseTimestamp(schema: Record<string, any>): TimestampType {
        return new TimestampType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private static getValidValues(values: string[] | undefined): string[] | undefined {
        if (!values) {
            return undefined
        }

        const vals = values.filter(s => s != null)

        return vals.length ? vals : undefined
    }

    private parseEnum(enumClass: Constructor<any>, vals: string[]): EnumType {
        const enums = new EnumType().setName(enumClass.name).setValues(vals)

        this.enums.set(enumClass.name, enums)

        return enums
    }

    private parse(schema: Record<string, any>): BaseType {
        switch (schema.type) {
            case 'object': {
                if (schema.additionalProperties !== false) {
                    return this.parseMap(schema)
                }

                return this.parseObject(schema)
            }
            case 'any':
                return TypeParser.parseAny(schema)
            case 'array':
                return this.parseArray(schema)
            case 'boolean':
                return TypeParser.parseBoolean(schema)
            case 'string':
                return this.parseString(schema)
            case 'number': {
                if (schema.format === 'decimal') {
                    return TypeParser.parseDecimal(schema)
                } else if (schema.format === 'timestamp') {
                    return TypeParser.parseTimestamp(schema)
                } else if (schema.format === 'money') {
                    return TypeParser.parseMoney(schema)
                }

                return TypeParser.parseNumber(schema)
            }
            case 'null':
                return new AnyType()
        }

        return new AnyType()
    }

    private parseObject(schema: Record<string, any>): ObjectType {
        const fields: Record<string, BaseType> = {}
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, subSchema]) => {
                fields[key] = this.parse(subSchema as Record<string, any>) as BaseType
            })
        }

        const type = new ObjectType()
            .setKind('model')
            .setName(schema.ref.name)
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
            .setFields(fields)

        if (this.rootName !== schema.ref.name) {
            this.objects.set(schema.ref.name, type)
        }

        return type
    }

    private parseMap(schema: Record<string, any>): MapType {
        const subType = this.parse(schema.additionalProperties as Record<string, any>)

        return new MapType()
            .setKey(new StringType())
            .setValue(subType)
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private parseArray(schema: Record<string, any>): ArrayType {
        const items = this.parse(schema.items as Record<string, any>) as any

        return new ArrayType()
            .setItems(items)
            .setDoc({desc: schema.description, deprecated: schema.deprecated})
            .setOptional(schema.optional ?? false)
    }

    private parseString(schema: Record<string, any>): StringType {
        const validValues = TypeParser.getValidValues(schema.enum)
        if (schema.enumClass) {
            this.parseEnum(schema.enumClass, schema.enum)
        }

        return new StringType()
            .setDoc({desc: schema.description, deprecated: schema.deprecated, validValues})
            .setValues(validValues)
            .setOptional(schema.optional ?? false)
    }
}
