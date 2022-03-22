import {QueryOptions} from './interfaces'
import {ExpressionAttributeValueMap} from 'aws-sdk/clients/dynamodb'

export function createKeyCondition(
    hashKeyValue: string,
    rangeKeyName: string,
    options?: QueryOptions,
    prefix?: string,
): {
    KeyConditionExpression: string
    ExpressionAttributeValues: ExpressionAttributeValueMap
    ScanIndexForward?: boolean
    FilterExpression?: string
    ExpressionAttributeNames?: Record<string, string>
} {
    const rkPrefix = prefix ? `${prefix}-` : ''

    const filterExpression = options?.filter?.expression
    const expressionAttributeNames = options?.filter?.keys
    const filterAttributeValues = options?.filter?.values

    if (options) {
        if (options.rangeKey) {
            if (options.rangeKey.eq) {
                return {
                    KeyConditionExpression: `hk = :hk and ${rangeKeyName} = :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':rk': {S: `${rkPrefix}${options.rangeKey.eq}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }

            if (options.rangeKey.beginWith) {
                return {
                    KeyConditionExpression: `hk = :hk and begins_with(${rangeKeyName}, :rk)`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':rk': {S: `${rkPrefix}${options.rangeKey.beginWith}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }

            if (options.rangeKey.gt) {
                return {
                    KeyConditionExpression: `hk = :hk and ${rangeKeyName} > :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':rk': {S: `${rkPrefix}${options.rangeKey.gt}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }

            if (options.rangeKey.gte) {
                return {
                    KeyConditionExpression: `hk = :hk and ${rangeKeyName} >= :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':rk': {S: `${rkPrefix}${options.rangeKey.gte}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }

            if (options.rangeKey.lt) {
                return {
                    KeyConditionExpression: `hk = :hk and ${rangeKeyName} < :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':rk': {S: `${rkPrefix}${options.rangeKey.lt}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }

            if (options.rangeKey.lte) {
                return {
                    KeyConditionExpression: `hk = :hk and ${rangeKeyName} <= :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':rk': {S: `${rkPrefix}${options.rangeKey.lte}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }

            if (options.rangeKey.between) {
                return {
                    KeyConditionExpression: `hk = :hk and ${rangeKeyName} BETWEEN :a and :b`,
                    ExpressionAttributeValues: {
                        ':hk': {S: hashKeyValue},
                        ':a': {S: `${rkPrefix}${options.rangeKey.between.from}`},
                        ':b': {S: `${rkPrefix}${options.rangeKey.between.to}`},
                        ...filterAttributeValues,
                    },
                    ScanIndexForward: options.sortAsc,
                    FilterExpression: filterExpression,
                    ExpressionAttributeNames: expressionAttributeNames,
                }
            }
        }

        if (prefix) {
            return {
                KeyConditionExpression: `hk = :hk and begins_with(${rangeKeyName}, :rk)`,
                ExpressionAttributeValues: {
                    ':hk': {S: hashKeyValue},
                    ':rk': {S: prefix},
                    ...filterAttributeValues,
                },
                ScanIndexForward: options.sortAsc,
                FilterExpression: filterExpression,
                ExpressionAttributeNames: expressionAttributeNames,
            }
        }

        return {
            KeyConditionExpression: 'hk = :hk',
            ExpressionAttributeValues: {
                ':hk': {S: hashKeyValue},
                ...filterAttributeValues,
            },
            ScanIndexForward: options.sortAsc,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
        }
    }

    if (prefix) {
        return {
            KeyConditionExpression: `hk = :hk and begins_with(${rangeKeyName}, :rk)`,
            ExpressionAttributeValues: {
                ':hk': {S: hashKeyValue},
                ':rk': {S: prefix},
                ...filterAttributeValues,
            },
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
        }
    }

    return {
        KeyConditionExpression: 'hk = :hk',
        ExpressionAttributeValues: {
            ':hk': {S: hashKeyValue},
            ...filterAttributeValues,
        },
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
    }
}
