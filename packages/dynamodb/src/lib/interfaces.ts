import {ExpressionAttributeNameMap, ExpressionAttributeValueMap, Key} from 'aws-sdk/clients/dynamodb'
import {Constructor} from '@plimble/jaco-common'
import {Aggregate, Entity, Message} from '@plimble/jaco-domain'

export type DdbModel = Entity | Aggregate

export type IndexData = {
    hashKey: string
    [index: string]: string | undefined
}

export interface MessagePublisher {
    publish(messages: Message[]): Promise<void>
}

export type CustomData = {
    [field: string]: any
}

export interface DDBDeleteKey {
    hashKey: string
    id: string
}

export interface DDBScanItem {
    hashKey: string
    rk: string
    state: any
    time: number
    version: number
}

export interface PageOutput<T> {
    items: T[]
    nextToken?: string
}

export interface ScanOutput<T> {
    items: T[]
    lastEvaluatedKey?: Key
}

export interface QueryPageOptions extends QueryOptions {
    token?: string
    limit: number
}

export interface DdbRepoOptions<T extends DdbModel> {
    model: Constructor<T>
    schema: DdbTableSchema
    prefixRangeKey?: string
    defaultTTLInSec?: number
    publisher?: MessagePublisher
}

export interface DbAggregate {
    state: Record<string, any>
    time: number
    version: number
}

export type ScanAllHandler<T> = (items: T[]) => Promise<void>

export interface SaveOptions {
    ttl?: number
    aggregateOnly?: boolean
    autoVersion?: boolean
    forceVersion?: boolean
    condition?: string
}

export interface RangeKeyCondition {
    eq?: string
    gt?: string
    gte?: string
    lt?: string
    lte?: string
    beginWith?: string
    between?: {
        from: string
        to: string
    }
}

export interface FilterCondition {
    expression: string
    keys: ExpressionAttributeNameMap
    values: ExpressionAttributeValueMap
}

export interface QueryOptions {
    hashKey: string
    index?: string
    rangeKey?: RangeKeyCondition
    sortAsc?: boolean
    filter?: FilterCondition
    consistentRead?: boolean
}

export interface GetOptions {
    hashKey: string
    rangeKey: string
    index?: string
}

export interface MultiGetOptions {
    hashKey: string
    rangeKeys: string[]
    index?: string
}

export interface DdbTableSchema {
    tableName: string
    billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
    attributes: Array<{
        name: string
        type: 'S' | 'N'
    }>
    globalSecondaryIndexes?: Array<{
        hashKey: string
        rangeKey: string
        name: string
        projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE' | string
        nonKeyAttributes?: string[]
        readCapacity?: number
        writeCapacity?: number
    }>
    localSecondaryIndexes?: Array<{
        rangeKey: string
        name: string
        projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
        nonKeyAttributes?: string[]
    }>
    readCapacity?: number
    writeCapacity?: number
    ttl?: string
    tags?: Record<string, string>
}

export interface DeleteOptions {
    forceDelete?: boolean
    condition?: string
}
