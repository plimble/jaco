import DynamoDB, {ExpressionAttributeValueMap, Key} from 'aws-sdk/clients/dynamodb'

import {
    AggregateRepoOptions,
    CustomFields,
    DbAggregate,
    DDBDeleteKey,
    DDBScanItem,
    GetAllByIndexInput,
    GetByIndexInput,
    GetPageByIndexInput,
    GetPageInput,
    IndexMapper,
    IndexName,
    MultiGetByIndexInput,
    PageOutput,
    QueryOptions,
    SaveOptions,
    ScanAllHandler,
    ScanOutput,
} from './interfaces'
import {container} from 'tsyringe'
import {AppError, Clock, Constructor, InternalError, wrapError} from '@onedaycat/jaco-common'
import {DynamoDBx, ScanPageOutput} from '@onedaycat/jaco-awsx'
import {Aggregate} from '../ddd/aggregate'
import {EventPublisher} from '../event-publisher/event-publisher'
import {marshallAttributes, unmarshallAttributes} from '../ddd/attribute-decorator'

export abstract class AggregateRepo<T extends Aggregate> {
    protected aggregate: Constructor<T>
    protected aggregateType: string
    protected tableName: string
    protected db: DynamoDBx
    protected indexMapper: IndexMapper<T>
    protected customerFields?: CustomFields<T>
    protected indexName?: IndexName
    protected defaultTTLInSec: number
    protected eventPublisher: EventPublisher
    protected deleteCondition?: string
    private index = new Map<string, string>()

    protected constructor(options: AggregateRepoOptions<T>) {
        this.aggregate = options.aggregate
        this.aggregateType = options.aggregateType
        this.tableName = options.tableName
        this.db = options.db
        this.indexMapper = options.indexMapper
        this.indexName = options.indexName
        this.deleteCondition = options.deleteCondition
        this.defaultTTLInSec = options.defaultTTLInSec ?? 0
        this.customerFields = options.customFields
        this.eventPublisher = container.resolve(EventPublisher)
        this.initIndex()
    }

    private static createKeyCondition(
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

    async createTable(): Promise<void> {
        const schema: DynamoDB.Types.CreateTableInput = {
            TableName: this.tableName,
            BillingMode: 'PAY_PER_REQUEST',
            AttributeDefinitions: [
                {AttributeName: 'hk', AttributeType: 'S'},
                {AttributeName: 'rk', AttributeType: 'S'},
                {AttributeName: 'index1', AttributeType: 'S'},
                {AttributeName: 'index2', AttributeType: 'S'},
                {AttributeName: 'index3', AttributeType: 'S'},
                {AttributeName: 'index4', AttributeType: 'S'},
                {AttributeName: 'index5', AttributeType: 'S'},
            ],
            KeySchema: [
                {AttributeName: 'hk', KeyType: 'HASH'},
                {AttributeName: 'rk', KeyType: 'RANGE'},
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'index1',
                    KeySchema: [
                        {AttributeName: 'hk', KeyType: 'HASH'},
                        {AttributeName: 'index1', KeyType: 'RANGE'},
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
                {
                    IndexName: 'index2',
                    KeySchema: [
                        {AttributeName: 'hk', KeyType: 'HASH'},
                        {AttributeName: 'index2', KeyType: 'RANGE'},
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
                {
                    IndexName: 'index3',
                    KeySchema: [
                        {AttributeName: 'hk', KeyType: 'HASH'},
                        {AttributeName: 'index3', KeyType: 'RANGE'},
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
                {
                    IndexName: 'index4',
                    KeySchema: [
                        {AttributeName: 'hk', KeyType: 'HASH'},
                        {AttributeName: 'index4', KeyType: 'RANGE'},
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
                {
                    IndexName: 'index5',
                    KeySchema: [
                        {AttributeName: 'hk', KeyType: 'HASH'},
                        {AttributeName: 'index5', KeyType: 'RANGE'},
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
            ],
        }

        await this.db.createTable(schema)
    }

    async deleteTable(): Promise<void> {
        await this.db.deleteTable({
            TableName: this.tableName,
        })
    }

    async save(agg: T, options?: SaveOptions): Promise<void> {
        await this.getSaveTransaction(agg, options)
    }

    async delete(agg: T, forceDelete = false): Promise<void> {
        await this.getDeleteTransaction(agg, forceDelete)
    }

    async getSaveTransaction(agg: T, options?: SaveOptions): Promise<void> {
        if (!agg.hasChanged() && !options?.forceVersion) {
            return
        }

        if (options?.autoVersion) {
            agg.version = agg.version + 1
        }

        const committedEvents = agg.getEvents()
        agg.clearEvents()
        const indexData = this.indexMapper(agg)

        const payloadExtra: Record<string, any> = {
            rk: `${this.aggregateType}-${agg.id}`,
        }

        for (const [indexName, value] of Object.entries(indexData)) {
            if (indexName === 'hashKey' && value) {
                payloadExtra.hk = value
            } else if (value) {
                payloadExtra[this.getIndex(indexName)] = value
            }
        }

        if (options?.ttl && options.ttl > 0) {
            payloadExtra.ttl = Clock.add(Clock.new(), options.ttl, 'second')
        } else {
            payloadExtra.ttl = this.defaultTTLInSec > 0 ? Clock.add(Clock.new(), this.defaultTTLInSec, 'second') : 0
        }

        if (this.customerFields) {
            const customFields = this.customerFields(agg)
            for (const [key, value] of Object.entries(customFields)) {
                payloadExtra[key] = value
            }
        }

        const ddbModel: DbAggregate = {
            state: marshallAttributes(this.aggregate, agg),
            version: agg.version,
            time: agg.time,
        }

        const payloadItem = DynamoDBx.marshall(ddbModel, payloadExtra)

        const tx: DynamoDB.TransactWriteItemList = []
        tx.push({
            Put: {
                TableName: this.tableName,
                Item: payloadItem,
                ConditionExpression: options?.forceVersion
                    ? undefined
                    : 'attribute_not_exists(version) or (attribute_exists(version) and version < :v)',
                ExpressionAttributeValues: {
                    ':v': {N: agg.version.toString()},
                },
            },
        })

        try {
            await this.db.transactWriteItems({TransactItems: tx})
        } catch (e) {
            throw wrapError(e).withInput(tx)
        }

        if (options?.aggregateOnly) return

        try {
            if (committedEvents && committedEvents.length) {
                await this.eventPublisher.publish(committedEvents)
            }
        } catch (e) {
            throw wrapError(e).withInput(committedEvents)
        }
    }

    async getDeleteTransaction(agg: T, forceDelete = false): Promise<void> {
        const indexData = this.indexMapper(agg)
        const committedEvents = agg.getEvents()
        agg.clearEvents()
        const tx: DynamoDB.TransactWriteItemList = [
            {
                Delete: {
                    TableName: this.tableName,
                    Key: {
                        hk: {S: indexData.hashKey},
                        rk: {S: `${this.aggregateType}-${agg.id}`},
                    },
                    ConditionExpression: this.deleteCondition,
                },
            },
        ]

        try {
            if ((committedEvents && committedEvents.length) || forceDelete) {
                await this.db.transactWriteItems({TransactItems: tx})
            }
        } catch (e) {
            throw wrapError(e).withInput(tx)
        }

        try {
            if (committedEvents && committedEvents.length) {
                await this.eventPublisher.publish(committedEvents)
            }
        } catch (e) {
            wrapError(e).withInput(committedEvents)
        }
    }

    async multiDelete(aggs: Array<T>, forceDelete = false): Promise<void> {
        try {
            if (aggs && aggs.length) {
                await Promise.all(
                    aggs.map(agg => {
                        if (forceDelete || agg.hasChanged()) {
                            return this.delete(agg, forceDelete)
                        }

                        return undefined
                    }),
                )
            }
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    async multiSave(aggs: Array<T>, options?: SaveOptions): Promise<void> {
        try {
            if (aggs && aggs.length) {
                await Promise.all(
                    aggs.map(agg => {
                        return this.save(agg, options)
                    }),
                )
            }
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    async scan(limit: number, lastEvaluatedKey?: Key): Promise<ScanOutput<T>> {
        const result = await this.db.scanPage({
            Scan: {
                TableName: this.tableName,
                Limit: limit,
                ExclusiveStartKey: lastEvaluatedKey,
            },
        })

        const items: T[] = []
        for (const item of result.Items) {
            const aggPayload = DynamoDBx.unmarshall<DDBScanItem>(item)
            if (aggPayload.rk.startsWith(this.aggregateType)) {
                const item = unmarshallAttributes(this.aggregate, aggPayload.state)
                item.version = aggPayload.version
                item.time = aggPayload.time
                items.push(item)
            }
        }

        return {
            items: items,
            lastEvaluatedKey: result.lastEvaluatedKey,
        }
    }

    async scanAll(fn: ScanAllHandler<T>, limit: number): Promise<void> {
        let lastEvaluatedKey: DynamoDB.AttributeMap | undefined = undefined
        while (Boolean) {
            const result: ScanPageOutput = await this.db.scanPage({
                Scan: {
                    TableName: this.tableName,
                    Limit: limit,
                    ExclusiveStartKey: lastEvaluatedKey,
                },
            })

            const items: T[] = []
            for (const item of result.Items) {
                const aggPayload = DynamoDBx.unmarshall<DDBScanItem>(item)
                if (aggPayload.rk.startsWith(this.aggregateType)) {
                    const item = unmarshallAttributes(this.aggregate, aggPayload.state)
                    item.version = aggPayload.version
                    item.time = aggPayload.time
                    items.push(item)
                }
            }

            await fn(items)

            if (result.lastEvaluatedKey) {
                lastEvaluatedKey = result.lastEvaluatedKey
            } else {
                break
            }
        }
    }

    protected async forceDeleteAllByHashKey(hashKey: string): Promise<void> {
        const keys: Array<DDBDeleteKey> = []
        let token: string | undefined = undefined
        while (Boolean) {
            const result = (await this.getPage({
                hashKey: hashKey,
                limit: 1000,
                token,
            })) as PageOutput<Aggregate>

            if (result.items.length) {
                for (const item of result.items) {
                    keys.push({hashKey: hashKey, id: item.id})
                }
            }

            if (result.nextToken) {
                token = result.nextToken
            } else {
                break
            }
        }

        await this.multiDeleteById(keys)
    }

    protected async multiGet(hashKey: string, rangeKeys: string[]): Promise<{[id: string]: T} | undefined> {
        try {
            const noDupRangeKeys = Array.from(new Set<string>(rangeKeys))
            const keyItems = noDupRangeKeys.map<DynamoDB.AttributeMap>(key => {
                return {
                    hk: {S: hashKey},
                    rk: {S: `${this.aggregateType}-${key}`},
                }
            })

            const items = await this.db.multiGetItem({
                TableName: this.tableName,
                KeysAndAttributes: {
                    Keys: keyItems,
                },
            })
            if (!items.length) {
                return undefined
            }

            const aggs: {[id: string]: T} = {}
            items
                .map<T>(item => {
                    const aggPayload = DynamoDBx.unmarshall<DbAggregate>(item)
                    const agg = unmarshallAttributes(this.aggregate, aggPayload.state)
                    agg.version = aggPayload.version
                    agg.time = aggPayload.time

                    return agg
                })
                .forEach(s => {
                    aggs[s.id] = s
                })

            return aggs
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async getAll(hashKey: string, options?: QueryOptions): Promise<T[]> {
        try {
            const query = AggregateRepo.createKeyCondition(hashKey, 'rk', options, this.aggregateType)

            const items = await this.db.query({
                TableName: this.tableName,
                KeyConditionExpression: query.KeyConditionExpression,
                ExpressionAttributeValues: query.ExpressionAttributeValues,
                ScanIndexForward: query.ScanIndexForward,
                ConsistentRead: options?.consistentRead ?? true,
                FilterExpression: query.FilterExpression,
                ExpressionAttributeNames: query.ExpressionAttributeNames,
            })

            if (!items.length) {
                return []
            }

            const aggs: T[] = []
            for (const item of items) {
                const aggPayload = DynamoDBx.unmarshall<DbAggregate>(item)
                const agg = unmarshallAttributes(this.aggregate, aggPayload.state)
                agg.version = aggPayload.version
                agg.time = aggPayload.time

                aggs.push(agg)
            }

            return aggs
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async getPage(input: GetPageInput): Promise<PageOutput<T>> {
        try {
            const query = AggregateRepo.createKeyCondition(input.hashKey, 'rk', input.options, this.aggregateType)

            const res = await this.db.queryPage({
                HashKey: 'hk',
                RangeKey: 'rk',
                HashValue: input.hashKey,
                Token: input.token,
                Query: {
                    TableName: this.tableName,
                    KeyConditionExpression: query.KeyConditionExpression,
                    ExpressionAttributeValues: query.ExpressionAttributeValues,
                    Limit: input.limit,
                    ConsistentRead: input.options?.consistentRead ?? true,
                    ScanIndexForward: query.ScanIndexForward,
                    FilterExpression: query.FilterExpression,
                    ExpressionAttributeNames: query.ExpressionAttributeNames,
                },
            })

            if (!res.Items.length) {
                return {items: []}
            }

            const aggs: T[] = []
            for (const item of res.Items) {
                const aggPayload = DynamoDBx.unmarshall<DbAggregate>(item)
                const agg = unmarshallAttributes(this.aggregate, aggPayload.state)
                agg.version = aggPayload.version
                agg.time = aggPayload.time

                aggs.push(agg)
            }

            return {items: aggs, nextToken: res.NextToken}
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async getPageByIndex(input: GetPageByIndexInput): Promise<PageOutput<T>> {
        try {
            const indexName = this.getIndex(input.index)

            const query = AggregateRepo.createKeyCondition(input.hashKey, indexName, input.options)

            const res = await this.db.queryPage({
                HashKey: 'hk',
                RangeKey: indexName,
                HashValue: input.hashKey,
                Token: input.token,
                Query: {
                    TableName: this.tableName,
                    IndexName: indexName,
                    KeyConditionExpression: query.KeyConditionExpression,
                    ExpressionAttributeValues: query.ExpressionAttributeValues,
                    Limit: input.limit,
                    ScanIndexForward: query.ScanIndexForward,
                    FilterExpression: query.FilterExpression,
                    ExpressionAttributeNames: query.ExpressionAttributeNames,
                },
            })

            if (!res.Items.length) {
                return {items: []}
            }

            const aggs: T[] = []
            for (const item of res.Items) {
                const aggPayload = DynamoDBx.unmarshall<DbAggregate>(item)
                const agg = unmarshallAttributes(this.aggregate, aggPayload.state)
                agg.version = aggPayload.version
                agg.time = aggPayload.time

                aggs.push(agg)
            }

            return {items: aggs, nextToken: res.NextToken}
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async getAllByIndex(input: GetAllByIndexInput): Promise<T[]> {
        try {
            const indexName = this.getIndex(input.index)

            const query = AggregateRepo.createKeyCondition(input.hashKey, indexName, input.options)

            const items = await this.db.query({
                TableName: this.tableName,
                IndexName: indexName,
                KeyConditionExpression: query.KeyConditionExpression,
                ExpressionAttributeValues: query.ExpressionAttributeValues,
                ScanIndexForward: query.ScanIndexForward,
                FilterExpression: query.FilterExpression,
                ExpressionAttributeNames: query.ExpressionAttributeNames,
            })

            if (!items.length) {
                return []
            }

            const aggs: T[] = []
            for (const item of items) {
                const aggPayload = DynamoDBx.unmarshall<DbAggregate>(item)
                const agg = unmarshallAttributes(this.aggregate, aggPayload.state)
                agg.version = aggPayload.version
                agg.time = aggPayload.time

                aggs.push(agg)
            }

            return aggs
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async multiGetByIndex(input: MultiGetByIndexInput): Promise<{[id: string]: T} | undefined> {
        try {
            const indexName = this.getIndex(input.index)
            const rangeKeys = Array.from(new Set<string>(input.rangeKeys))

            const items = await this.db.multiQuery(
                rangeKeys.map(rangeKey => ({
                    TableName: this.tableName,
                    IndexName: indexName,
                    KeyConditionExpression: `hk = :hk and ${indexName} = :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: input.hashKey},
                        ':rk': {S: rangeKey},
                    },
                    Limit: 1,
                })),
            )

            if (!items.length) {
                return undefined
            }

            const aggs: {[id: string]: T} = {}
            items
                .map<T>(item => {
                    const aggPayload = DynamoDBx.unmarshall<DbAggregate>(item)
                    const agg = unmarshallAttributes(this.aggregate, aggPayload.state)
                    agg.version = aggPayload.version
                    agg.time = aggPayload.time

                    return agg
                })
                .forEach(s => {
                    aggs[s.id] = s
                })

            return aggs
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async getByIndex(input: GetByIndexInput): Promise<T | undefined> {
        try {
            const indexName = this.getIndex(input.index)
            const query = AggregateRepo.createKeyCondition(input.hashKey, indexName, input.options)

            const items = await this.db.query({
                TableName: this.tableName,
                IndexName: indexName,
                KeyConditionExpression: query.KeyConditionExpression,
                ExpressionAttributeValues: query.ExpressionAttributeValues,
                ScanIndexForward: query.ScanIndexForward,
                FilterExpression: query.FilterExpression,
                ExpressionAttributeNames: query.ExpressionAttributeNames,
                Limit: 1,
            })

            if (!items.length) {
                return undefined
            }

            const payload = DynamoDBx.unmarshall<DbAggregate>(items[0])
            const agg = unmarshallAttributes(this.aggregate, payload.state)
            agg.version = payload.version
            agg.time = payload.time

            return agg
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async multiDeleteById(keys: Array<DDBDeleteKey>): Promise<void> {
        try {
            if (keys.length) {
                await this.db.multiWriteItem({
                    Items: keys.map(key => ({
                        TableName: this.tableName,
                        DeleteItem: {
                            Key: {
                                hk: {S: key.hashKey},
                                rk: {S: `${this.aggregateType}-${key.id}`},
                            },
                        },
                    })),
                })
            }
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async get(hashKey: string, rangeKeyBeginWith: string): Promise<T | undefined> {
        try {
            const dbInput: DynamoDB.GetItemInput = {
                TableName: this.tableName,
                ConsistentRead: true,
                Key: {
                    hk: {S: hashKey},
                    rk: {S: `${this.aggregateType}-${rangeKeyBeginWith}`},
                },
            }

            const item = await this.db.getItem(dbInput)
            if (!item) {
                return undefined
            }

            const payload = DynamoDBx.unmarshall<DbAggregate>(item)
            const agg = unmarshallAttributes(this.aggregate, payload.state)
            agg.version = payload.version
            agg.time = payload.time

            return agg
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    private initIndex() {
        if (this.indexName) {
            for (const [index, name] of Object.entries(this.indexName)) {
                if (name) {
                    this.index.set(name, index)
                }
            }
        }
    }

    private getIndex(name: string): string {
        if (!this.indexName) {
            throw new AppError(InternalError).withMessage(`Index ${name} not found`)
        }

        const indexKey = this.index.get(name)
        if (!indexKey) {
            throw new AppError(InternalError).withMessage(`Index ${name} not found`)
        }

        return indexKey
    }
}
