import {Constructor} from '@onedaycat/jaco-common'

export type DynamodbResourceFn = (env: string) => DynamodbResourceOptions

export interface DynamodbResourceOptions {
    name: string
    attributes: DynamodbAttribute[]
    billingMode: 'PAY_PER_REQUEST'
    hashKey: string
    rangeKey: string
    ttl: DynamodbTTL
    globalSecondaryIndexes: GlobalSecondaryIndexe[]
}

export interface DynamodbAttribute {
    name: string
    type: string
}

export interface DynamodbTTL {
    attributeName: string
    enabled: true
}

export interface GlobalSecondaryIndexe {
    hashKey: string
    rangeKey: string
    name: string
    projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
}

const DDB_KEY = Symbol('jaco:ddb')

export function DynamodbResource(fn: DynamodbResourceFn): ClassDecorator {
    return function (target: any) {
        Reflect.defineMetadata(DDB_KEY, fn(process.env.JACO_ENV ?? 'dev'), target)
    }
}

export function getDynamodbResource(ddbClass: Constructor<any>): DynamodbResourceOptions | undefined {
    return Reflect.getMetadata(DDB_KEY, ddbClass)
}
