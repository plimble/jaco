import {Aggregate, AggregatePayload, AggregateState} from '@onedaycat/jaco-domain'
import {DynamoDBx} from '../services/ddbx'
import {ExpressionAttributeNameMap, ExpressionAttributeValueMap, Key} from 'aws-sdk/clients/dynamodb'

export type IndexMapper<T extends Model> = (agg: T) => IndexData
export type CustomFields<T extends Model> = (agg: T) => CustomData

export type IndexData = {
    hashKey: string
    [index: string]: string | undefined
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
}

export type IndexName = {
    index1?: string
    index2?: string
    index3?: string
    index4?: string
    index5?: string
}

export interface PageOutput<T> {
    items: T[]
    nextToken?: string
}

export interface ScanOutput<T> {
    items: T[]
    lastEvaluatedKey?: Key
}

export interface GetByIndexInput {
    hashKey: string
    index: string
    options?: QueryOptions
}

export interface GetAllByIndexInput {
    hashKey: string
    index: string
    options?: QueryOptions
}

export interface GetPageInput {
    hashKey: string
    token?: string
    limit: number
    options?: QueryOptions
}

export interface GetPageByIndexInput {
    hashKey: string
    index: string
    token?: string
    limit: number
    options?: QueryOptions
}

export interface MultiGetByIndexInput {
    hashKey: string
    rangeKeys: string[]
    index: string
}

export interface AggregateRepoOptions<T extends Aggregate<any>> {
    aggregateType: string
    tableName: string
    db: DynamoDBx
    createFactory: AggregateStoreCreateFactory
    indexMapper: IndexMapper<T>
    indexName?: IndexName
    deleteCondition?: string
    defaultTTLInSec?: number
    customFields?: CustomFields<T>
}

export type AggregateStoreCreateFactory<T extends AggregateState = any> = (payload: AggregatePayload<T>) => T
export type QueryRepoCreateFactory<T extends Model> = (payload: any) => T
export type ScanAllHandler<T> = (items: T[]) => Promise<void>

export interface Model {
    getId(): string
    toJSON(): any
}

export interface QueryRepoOptions<T extends Model> {
    modelType: string
    tableName: string
    db: DynamoDBx
    createFactory: QueryRepoCreateFactory<T>
    indexMapper: IndexMapper<T>
    indexName?: IndexName
    saveCondition?: string
    deleteCondition?: string
    defaultTTLInSec?: number
    customFields?: CustomFields<T>
}

export type QueryDataModel = {
    hk: string
    rk: string
    ttl: number
    state: any
} & {[index: string]: string}

export interface SaveOptions {
    ttl?: number
    aggregateOnly?: boolean
    autoVersion?: boolean
    forceVersion?: boolean
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
    sortAsc?: boolean
    rangeKey?: RangeKeyCondition
    filter?: FilterCondition
    consistentRead?: boolean
}
