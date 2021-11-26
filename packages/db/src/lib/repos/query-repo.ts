import DynamoDB, {ExpressionAttributeValueMap, Key} from 'aws-sdk/clients/dynamodb'
import {
    CustomFields,
    DDBDeleteKey,
    DDBScanItem,
    GetAllByIndexInput,
    GetByIndexInput,
    GetPageByIndexInput,
    GetPageInput,
    IndexMapper,
    IndexName,
    Model,
    MultiGetByIndexInput,
    PageOutput,
    QueryDataModel,
    QueryOptions,
    QueryRepoCreateFactory,
    QueryRepoOptions,
    ScanAllHandler,
    ScanOutput,
} from './interfaces'
import {Clock, InternalError} from '@onedaycat/jaco-common'
import {DynamoDBx, ScanPageOutput} from '@onedaycat/jaco-awsx'

export abstract class QueryRepo<T extends Model> {
    protected modelType: string
    protected tableName: string
    protected db: DynamoDBx
    protected createFactory: QueryRepoCreateFactory<T>
    protected indexMapper: IndexMapper<T>
    protected indexName?: IndexName
    protected customerFields?: CustomFields<T>
    protected defaultTTLInSec: number
    protected saveCondition?: string
    protected deleteCondition?: string
    private index = new Map<string, string>()

    protected constructor(options: QueryRepoOptions<T>) {
        this.modelType = options.modelType
        this.tableName = options.tableName
        this.db = options.db
        this.createFactory = options.createFactory
        this.indexMapper = options.indexMapper
        this.indexName = options.indexName
        this.saveCondition = options.saveCondition
        this.deleteCondition = options.deleteCondition
        this.defaultTTLInSec = options.defaultTTLInSec ?? 0
        this.customerFields = options.customFields
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

        await Promise.all([this.db.createTable(schema)])
    }

    async deleteTable(): Promise<void> {
        await Promise.all([
            this.db.deleteTable({
                TableName: this.tableName,
            }),
        ])
    }

    async save(model: T, ttl?: number): Promise<void> {
        try {
            await this.db.putItem({
                TableName: this.tableName,
                Item: this.getPutItem(model, ttl),
                ConditionExpression: this.saveCondition,
            })
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    async delete(model: T): Promise<void> {
        try {
            const indexData = this.indexMapper(model)
            await this.db.deleteItem({
                TableName: this.tableName,
                Key: {
                    hk: {S: indexData.hashKey},
                    rk: {S: `${this.modelType}-${model.getId()}`},
                },
                ConditionExpression: this.deleteCondition,
            })
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    async deleteById(hashKey: string, id: string): Promise<void> {
        try {
            await this.db.deleteItem({
                TableName: this.tableName,
                Key: {
                    hk: {S: hashKey},
                    rk: {S: `${this.modelType}-${id}`},
                },
                ConditionExpression: this.deleteCondition,
            })
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    async multiDeleteById(keys: DDBDeleteKey[]): Promise<void> {
        try {
            if (keys.length) {
                await this.db.multiWriteItem({
                    Items: keys.map(key => ({
                        TableName: this.tableName,
                        DeleteItem: {
                            Key: {
                                hk: {S: key.hashKey},
                                rk: {S: `${this.modelType}-${key.id}`},
                            },
                        },
                    })),
                })
            }
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    async multiDelete(models?: Array<T>): Promise<void> {
        try {
            if (models && models.length) {
                await Promise.all(
                    models.map(model => {
                        return this.delete(model)
                    }),
                )
            }
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    async multiSave(models: Array<T>, ttl?: number): Promise<void> {
        try {
            if (models && models.length) {
                await this.db.multiWriteItem({
                    Items: models.map(model => ({
                        TableName: this.tableName,
                        PutItem: {
                            Item: this.getPutItem(model, ttl),
                        },
                    })),
                })
            }
        } catch (e) {
            throw new InternalError().withCause(e)
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
            if (aggPayload.rk.startsWith(this.modelType)) {
                items.push(this.createFactory(aggPayload))
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
                if (aggPayload.rk.startsWith(this.modelType)) {
                    items.push(this.createFactory(aggPayload.state))
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
        const keys: DDBDeleteKey[] = []
        let token: string | undefined = undefined
        while (Boolean) {
            const result = (await this.getPage({
                hashKey: hashKey,
                limit: 1000,
                token,
            })) as PageOutput<Model>

            if (result.items.length) {
                for (const item of result.items) {
                    keys.push({hashKey: hashKey, id: item.getId()})
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

    protected async get(hashKey: string, rangeKeyBeginWith: string): Promise<T | undefined> {
        try {
            const dbInput: DynamoDB.GetItemInput = {
                TableName: this.tableName,
                ConsistentRead: true,
                Key: {
                    hk: {S: hashKey},
                    rk: {S: `${this.modelType}-${rangeKeyBeginWith}`},
                },
            }

            const item = await this.db.getItem(dbInput)
            if (!item) {
                return undefined
            }

            const data = DynamoDBx.unmarshall<QueryDataModel>(item)

            return this.createFactory(data.state)
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async multiGet(hashKey: string, rangeKeys: string[]): Promise<{[id: string]: T} | undefined> {
        try {
            const noDupRangeKeys = Array.from(new Set<string>(rangeKeys))
            const keyItems = noDupRangeKeys.map<DynamoDB.AttributeMap>(key => {
                return {
                    hk: {S: hashKey},
                    rk: {S: `${this.modelType}-${key}`},
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
                    const data = DynamoDBx.unmarshall<QueryDataModel>(item)

                    return this.createFactory(data.state)
                })
                .forEach(s => {
                    aggs[s.getId()] = s
                })

            return aggs
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async multiGetByIndex(input: MultiGetByIndexInput): Promise<{[id: string]: T} | undefined> {
        try {
            const indexName = this.getIndex(input.index)

            const noDupRangeKeys = Array.from(new Set<string>(input.rangeKeys))
            const items = await this.db.multiQuery(
                noDupRangeKeys.map(rangeKey => ({
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
                    const data = DynamoDBx.unmarshall<QueryDataModel>(item)

                    return this.createFactory(data.state)
                })
                .forEach(s => {
                    aggs[s.getId()] = s
                })

            return aggs
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async getAll(hashKey: string, options?: QueryOptions): Promise<T[]> {
        try {
            const query = QueryRepo.createKeyCondition(hashKey, 'rk', options, this.modelType)

            const items = await this.db.query({
                TableName: this.tableName,
                KeyConditionExpression: query.KeyConditionExpression,
                ExpressionAttributeValues: query.ExpressionAttributeValues,
                ScanIndexForward: query.ScanIndexForward,
                FilterExpression: query.FilterExpression,
                ConsistentRead: options?.consistentRead ?? true,
                ExpressionAttributeNames: query.ExpressionAttributeNames,
            })

            if (!items.length) {
                return []
            }

            const aggs: T[] = []
            for (const item of items) {
                const data = DynamoDBx.unmarshall<QueryDataModel>(item)
                aggs.push(this.createFactory(data.state))
            }

            return aggs
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async getPageByIndex(input: GetPageByIndexInput): Promise<PageOutput<T>> {
        try {
            const indexName = this.getIndex(input.index)

            const query = QueryRepo.createKeyCondition(input.hashKey, indexName, input.options)

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
                const data = DynamoDBx.unmarshall<QueryDataModel>(item)
                aggs.push(this.createFactory(data.state))
            }

            return {items: aggs, nextToken: res.NextToken}
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async getPage(input: GetPageInput): Promise<PageOutput<T>> {
        try {
            const query = QueryRepo.createKeyCondition(input.hashKey, 'rk', input.options, this.modelType)

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
                    ScanIndexForward: query.ScanIndexForward,
                    FilterExpression: query.FilterExpression,
                    ConsistentRead: input.options?.consistentRead ?? true,
                    ExpressionAttributeNames: query.ExpressionAttributeNames,
                },
            })

            if (!res.Items.length) {
                return {items: []}
            }

            const aggs: T[] = []
            for (const item of res.Items) {
                const data = DynamoDBx.unmarshall<QueryDataModel>(item)
                aggs.push(this.createFactory(data.state))
            }

            return {items: aggs, nextToken: res.NextToken}
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async getAllByIndex(input: GetAllByIndexInput): Promise<T[]> {
        try {
            const indexName = this.getIndex(input.index)

            const query = QueryRepo.createKeyCondition(input.hashKey, indexName, input.options)

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
                const data = DynamoDBx.unmarshall<QueryDataModel>(item)
                aggs.push(this.createFactory(data.state))
            }

            return aggs
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    protected async getByIndex(input: GetByIndexInput): Promise<T | undefined> {
        try {
            const indexName = this.getIndex(input.index)

            const query = QueryRepo.createKeyCondition(input.hashKey, indexName, input.options)

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

            const data = DynamoDBx.unmarshall<QueryDataModel>(items[0])

            return this.createFactory(data.state)
        } catch (e) {
            throw new InternalError().withCause(e)
        }
    }

    private getPutItem(model: T, ttl?: number): DynamoDB.PutItemInputAttributeMap {
        const indexData = this.indexMapper(model)

        const payloadExtra: Record<string, any> = {
            rk: `${this.modelType}-${model.getId()}`,
        }

        for (const [indexName, value] of Object.entries(indexData)) {
            if (indexName === 'hashKey' && value) {
                payloadExtra.hk = value
            } else if (value) {
                payloadExtra[this.getIndex(indexName)] = value
            }
        }

        if (ttl && ttl > 0) {
            payloadExtra.ttl = Clock.add(Clock.new(), ttl, 'second')
        } else {
            payloadExtra.ttl = this.defaultTTLInSec > 0 ? Clock.add(Clock.new(), this.defaultTTLInSec, 'second') : 0
        }

        if (this.customerFields) {
            const customFields = this.customerFields(model)
            for (const [key, value] of Object.entries(customFields)) {
                payloadExtra[key] = value
            }
        }

        return DynamoDBx.marshall({state: model.toJSON()}, payloadExtra)
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
            throw new InternalError(`Index ${name} not found`)
        }

        const indexKey = this.index.get(name)
        if (!indexKey) {
            throw new InternalError(`Index ${name} not found`)
        }

        return indexKey
    }
}
