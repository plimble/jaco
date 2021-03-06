import {ExpressionAttributeNameMap, ExpressionAttributeValueMap} from 'aws-sdk/clients/dynamodb'
import {FilterCondition} from './interfaces'

export type ValueTypes = string | number | undefined | boolean

export class DynamodbFilterBuilder {
    private readonly attrNames: ExpressionAttributeNameMap
    private readonly attrValues: ExpressionAttributeValueMap
    private valIndex = 1

    constructor() {
        this.attrNames = {}
        this.attrValues = {}
    }

    and(...queries: Array<string | undefined>): string | undefined {
        const queryFilter = queries.filter(Boolean)
        if (queryFilter.length) {
            if (queryFilter.length > 1) {
                return `(${queryFilter.join(' AND ')})`
            } else {
                return `${queryFilter.join(' AND ')}`
            }
        }

        return undefined
    }

    andNot(...queries: Array<string | undefined>): string | undefined {
        const queryFilter = queries.filter(Boolean)
        if (queryFilter.length) {
            if (queryFilter.length > 1) {
                return `(not (${queryFilter.join(' AND ')}))`
            }

            return `not (${queryFilter.join(' AND ')})`
        }

        return undefined
    }

    attributeExists(fieldName: string): string | undefined {
        if (!fieldName) {
            return undefined
        }

        const nameKey = this.getFieldNameKey(fieldName)

        return `attribute_exists(${nameKey})`
    }

    attributeNotExists(fieldName: string): string | undefined {
        if (!fieldName) {
            return undefined
        }

        const nameKey = this.getFieldNameKey(fieldName)

        return `attribute_not_exists(${nameKey})`
    }

    beginWith(fieldName: string, value: ValueTypes): string | undefined {
        if (value === undefined) {
            return undefined
        }

        const nameKey = this.getFieldNameKey(fieldName)
        const valKey = this.getValKey(value)

        return `begins_with(${nameKey}, ${valKey})`
    }

    between(fieldName: string, valueFrom: ValueTypes, valueTo: ValueTypes): string | undefined {
        if (valueFrom === undefined || valueTo === undefined) {
            return undefined
        }

        if (valueFrom && !valueTo) {
            return this.compare(fieldName, '>=', valueFrom)
        } else if (!valueFrom && valueTo) {
            return this.compare(fieldName, '<=', valueTo)
        }

        const nameKey = this.getFieldNameKey(fieldName)
        const valKeyFrom = this.getValKey(valueFrom)
        const valKeyTo = this.getValKey(valueTo)

        return `${nameKey} BETWEEN ${valKeyFrom} AND ${valKeyTo}`
    }

    build(queryString: string | undefined): FilterCondition | undefined {
        if (queryString) {
            return {
                expression: queryString,
                keys: this.attrNames,
                values: this.attrValues,
            }
        }

        return undefined
    }

    compare(fieldName: string, cmpr: '=' | '<' | '<=' | '>' | '>=' | '<>', value: ValueTypes): string | undefined {
        if (value === undefined) {
            return undefined
        }

        const nameKey = this.getFieldNameKey(fieldName)
        const valKey = this.getValKey(value)

        return `${nameKey} ${cmpr} ${valKey}`
    }

    compares(
        fieldName: string,
        cmpr: '=' | '<' | '<=' | '>' | '>=' | '<>',
        values: ValueTypes[] | undefined,
    ): string | undefined {
        if (!values) {
            return undefined
        }

        const valuesFilltered = values.filter(Boolean)
        if (!valuesFilltered.length) {
            return undefined
        }

        const strs: string[] = []
        for (const value of valuesFilltered) {
            const nameKey = this.getFieldNameKey(fieldName)
            const valKey = this.getValKey(value)

            strs.push(`${nameKey} ${cmpr} ${valKey}`)
        }

        if (strs.length > 1) {
            return `(${strs.join(' OR ')})`
        }

        return `${strs.join(' OR ')}`
    }

    contain(fieldName: string, value: ValueTypes): string | undefined {
        if (!value) {
            return undefined
        }

        const nameKey = this.getFieldNameKey(fieldName)
        const valKey = this.getValKey(value)

        return `contains(${nameKey}, ${valKey})`
    }

    contains(fieldName: string, values: ValueTypes[] | undefined): string | undefined {
        if (!values) {
            return undefined
        }

        const valuesFilltered = values.filter(Boolean)
        if (!valuesFilltered.length) {
            return undefined
        }

        const strs: string[] = []
        for (const value of valuesFilltered) {
            const nameKey = this.getFieldNameKey(fieldName)
            const valKey = this.getValKey(value)

            strs.push(`contains(${nameKey}, ${valKey})`)
        }

        if (strs.length > 1) {
            return `(${strs.join(' OR ')})`
        }

        return `${strs.join(' OR ')}`
    }

    or(...queries: Array<string | undefined>): string | undefined {
        const queryFilter = queries.filter(Boolean)
        if (queryFilter.length) {
            if (queryFilter.length > 1) {
                return `(${queryFilter.join(' OR ')})`
            } else {
                return `${queryFilter.join(' OR ')}`
            }
        }

        return undefined
    }

    orNot(...queries: Array<string | undefined>): string | undefined {
        const queryFilter = queries.filter(Boolean)
        if (queryFilter.length) {
            if (queryFilter.length > 1) {
                return `(not (${queryFilter.join(' OR ')}))`
            }

            return `not (${queryFilter.join(' OR ')})`
        }

        return undefined
    }

    private getFieldNameKey(key: string): string {
        const nameKey = `#${key}`
        this.attrNames[nameKey] = key

        return nameKey
    }

    private getValKey(val: ValueTypes): string {
        const valKey = `:val${this.valIndex}`
        switch (typeof val) {
            case 'number':
                this.attrValues[valKey] = {N: val.toString()}
                break
            case 'undefined':
                this.attrValues[valKey] = {NULL: true}
                break
            case 'boolean':
                this.attrValues[valKey] = {BOOL: val}
                break
            default:
                this.attrValues[valKey] = {S: val}
                break
        }

        this.valIndex += 1

        return valKey
    }
}
