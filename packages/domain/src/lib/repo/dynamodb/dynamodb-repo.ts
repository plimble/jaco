import DynamoDB, {Key} from 'aws-sdk/clients/dynamodb'
import {
    CustomData,
    DbAggregate,
    DDBDeleteKey,
    DdbModel,
    DdbRepoOptions,
    DDBScanItem,
    DdbTableSchema,
    DeleteOptions,
    GetOptions,
    IndexData,
    MessagePublisher,
    MultiGetOptions,
    PageOutput,
    QueryOptions,
    QueryPageOptions,
    SaveOptions,
    ScanAllHandler,
    ScanOutput,
} from './interfaces'
import {container} from 'tsyringe'
import {AppError, Clock, Constructor, InternalError, wrapError} from '@onedaycat/jaco-common'
import {DynamoDBx, ScanPageOutput} from '@onedaycat/jaco-awsx'
import {Aggregate} from '../../model/aggregate'
import {createKeyCondition} from './create-key-condition'

export abstract class DynamodbRepo<T extends DdbModel> {
    protected model: Constructor<T>
    protected prefixRangeKey?: string
    protected db: DynamoDBx
    protected defaultTTLInSec: number
    protected eventPublisher?: MessagePublisher
    protected schema: DdbTableSchema

    protected constructor(options: DdbRepoOptions<T>) {
        this.eventPublisher = options.publisher
        this.db = container.resolve(DynamoDBx)
        this.model = options.model
        this.prefixRangeKey = options.prefixRangeKey
        this.defaultTTLInSec = options.defaultTTLInSec ?? 0
        this.schema = options.schema
    }

    abstract createFactory(payload: any): T

    async createTable(): Promise<void> {
        let attrs = [
            {AttributeName: 'hk', AttributeType: 'S'},
            {AttributeName: 'rk', AttributeType: 'S'},
        ]

        if (this.schema.attributes.length) {
            attrs = attrs.concat(
                this.schema.attributes.map(attr => ({
                    AttributeName: attr.name,
                    AttributeType: attr.type,
                })),
            )
        }

        const schema: DynamoDB.Types.CreateTableInput = {
            TableName: this.schema.tableName,
            BillingMode: this.schema.billingMode,
            AttributeDefinitions: attrs,
            KeySchema: [
                {AttributeName: 'hk', KeyType: 'HASH'},
                {AttributeName: 'rk', KeyType: 'RANGE'},
            ],
            GlobalSecondaryIndexes: this.schema.globalSecondaryIndexes?.length
                ? this.schema.globalSecondaryIndexes.map(index => {
                      return {
                          IndexName: index.name,
                          KeySchema: [
                              {AttributeName: index.hashKey, KeyType: 'HASH'},
                              {AttributeName: index.rangeKey, KeyType: 'RANGE'},
                          ],
                          Projection: {
                              ProjectionType: index.projectionType,
                              NonKeyAttributes: index.nonKeyAttributes,
                          },
                          ProvisionedThroughput:
                              index.readCapacity && index.writeCapacity
                                  ? {
                                        ReadCapacityUnits: index.readCapacity,
                                        WriteCapacityUnits: index.writeCapacity,
                                    }
                                  : undefined,
                      }
                  })
                : undefined,
            LocalSecondaryIndexes: this.schema.localSecondaryIndexes?.length
                ? this.schema.localSecondaryIndexes.map(index => {
                      return {
                          IndexName: index.name,
                          KeySchema: [{AttributeName: index.rangeKey, KeyType: 'RANGE'}],
                          Projection: {
                              ProjectionType: index.projectionType,
                              NonKeyAttributes: index.nonKeyAttributes,
                          },
                      }
                  })
                : undefined,
        }

        await this.db.createTable(schema)
    }

    abstract customFields(model: any): CustomData | undefined

    async delete(model: T, options?: DeleteOptions): Promise<void> {
        if (model instanceof Aggregate) {
            if (model.hasChanged() || options?.forceDelete) {
                await this.getDeleteTransaction(model, options)
            }
        } else {
            try {
                const indexData = this.indexMapper(model)
                await this.db.deleteItem({
                    TableName: this.schema.tableName,
                    Key: {
                        hk: {S: indexData.hashKey},
                        rk: {S: this.rk(model.id)},
                    },
                    ConditionExpression: options?.condition,
                })
            } catch (e) {
                throw new AppError(InternalError).withCause(e)
            }
        }
    }

    async deleteTable(): Promise<void> {
        await this.db.deleteTable({
            TableName: this.schema.tableName,
        })
    }

    async getDeleteTransaction(agg: Aggregate, options?: DeleteOptions): Promise<void> {
        const indexData = this.indexMapper(agg)
        const committedEvents = agg.getEvents()
        agg.clearEvents()

        const tx: DynamoDB.TransactWriteItemList = [
            {
                Delete: {
                    TableName: this.schema.tableName,
                    Key: {
                        hk: {S: indexData.hashKey},
                        rk: {S: this.rk(agg.id)},
                    },
                    ConditionExpression: options?.condition,
                },
            },
        ]

        try {
            if (committedEvents && committedEvents.length) {
                await this.db.transactWriteItems({TransactItems: tx})
            }
        } catch (e) {
            throw wrapError(e).withInput(tx)
        }

        try {
            if (committedEvents && committedEvents.length && this.eventPublisher) {
                await this.eventPublisher.publish(committedEvents)
            }
        } catch (e) {
            wrapError(e).withInput(committedEvents)
        }
    }

    async getSaveTransaction(agg: Aggregate, options?: SaveOptions): Promise<void> {
        if (!agg.hasChanged() && !options?.forceVersion) {
            return
        }

        if (options?.autoVersion) {
            agg.setVersion(agg.getVersion() + 1)
        }

        const committedEvents = agg.getEvents()
        agg.clearEvents()
        const indexData = this.indexMapper(agg)

        const payloadExtra: Record<string, any> = {
            rk: this.rk(agg.id),
        }

        for (const [indexName, value] of Object.entries(indexData)) {
            if (indexName === 'hashKey' && value) {
                payloadExtra.hk = value
            } else if (value) {
                payloadExtra[indexName] = value
            }
        }

        if (options?.ttl && options.ttl > 0) {
            payloadExtra.ttl = Clock.add(Clock.new(), options.ttl, 'second')
        } else {
            payloadExtra.ttl = this.defaultTTLInSec > 0 ? Clock.add(Clock.new(), this.defaultTTLInSec, 'second') : 0
        }

        const customFields = this.customFields(agg)
        if (customFields) {
            for (const [key, value] of Object.entries(customFields)) {
                payloadExtra[key] = value
            }
        }

        const ddbModel: DbAggregate = {
            state: agg.toObject(),
            version: agg.getVersion(),
            time: agg.getTime(),
        }

        const payloadItem = DynamoDBx.marshall(ddbModel, payloadExtra)

        const tx: DynamoDB.TransactWriteItemList = []
        tx.push({
            Put: {
                TableName: this.schema.tableName,
                Item: payloadItem,
                ConditionExpression: options?.forceVersion
                    ? undefined
                    : 'attribute_not_exists(version) or (attribute_exists(version) and version < :v)',
                ExpressionAttributeValues: {
                    ':v': {N: agg.getVersion().toString()},
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
            if (committedEvents && committedEvents.length && this.eventPublisher) {
                await this.eventPublisher.publish(committedEvents)
            }
        } catch (e) {
            throw wrapError(e).withInput(committedEvents)
        }
    }

    abstract indexMapper<T>(model: T): IndexData

    async multiDelete(aggs: Array<T>, options?: DeleteOptions): Promise<void> {
        try {
            if (aggs && aggs.length) {
                await Promise.all(
                    aggs.map(agg => {
                        return this.delete(agg, options)
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

    async save(model: T, options?: SaveOptions): Promise<void> {
        if (model instanceof Aggregate) {
            return this.getSaveTransaction(model, options)
        } else {
            try {
                const indexData = this.indexMapper(model)

                const payloadExtra: Record<string, any> = {
                    rk: this.rk(model.id),
                }

                for (const [indexName, value] of Object.entries(indexData)) {
                    if (indexName === 'hashKey' && value) {
                        payloadExtra.hk = value
                    } else if (value) {
                        payloadExtra[indexName] = value
                    }
                }

                if (options?.ttl && options.ttl > 0) {
                    payloadExtra.ttl = Clock.add(Clock.new(), options.ttl, 'second')
                } else {
                    payloadExtra.ttl =
                        this.defaultTTLInSec > 0 ? Clock.add(Clock.new(), this.defaultTTLInSec, 'second') : 0
                }

                const customFields = this.customFields(model)
                if (customFields) {
                    for (const [key, value] of Object.entries(customFields)) {
                        payloadExtra[key] = value
                    }
                }

                const item = DynamoDBx.marshall({state: model.toObject()}, payloadExtra)

                await this.db.putItem({
                    TableName: this.schema.tableName,
                    Item: item,
                    ConditionExpression: options?.condition,
                })
            } catch (e) {
                throw new AppError(InternalError).withCause(e)
            }
        }
    }

    async scan(limit: number, lastEvaluatedKey?: Key): Promise<ScanOutput<T>> {
        const result = await this.db.scanPage({
            Scan: {
                TableName: this.schema.tableName,
                Limit: limit,
                ExclusiveStartKey: lastEvaluatedKey,
            },
        })

        const items: T[] = []
        for (const item of result.Items) {
            const payload = DynamoDBx.unmarshall<DDBScanItem>(item)
            if (payload.rk.startsWith(this.prefixRangeKey ?? '')) {
                items.push(this.createModel(payload))
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
                    TableName: this.schema.tableName,
                    Limit: limit,
                    ExclusiveStartKey: lastEvaluatedKey,
                },
            })

            const items: T[] = []
            for (const item of result.Items) {
                const payload = DynamoDBx.unmarshall<DDBScanItem>(item)
                if (payload.rk.startsWith(this.prefixRangeKey ?? '')) {
                    items.push(this.createModel(payload))
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
            const result = (await this.queryPage({
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

    protected async get(options: GetOptions): Promise<T | undefined> {
        if (options.index) {
            return this.getByIndex(options)
        }

        try {
            const dbInput: DynamoDB.GetItemInput = {
                TableName: this.schema.tableName,
                ConsistentRead: true,
                Key: {
                    hk: {S: options.hashKey},
                    rk: {S: this.rk(options.rangeKey)},
                },
            }

            const item = await this.db.getItem(dbInput)
            if (!item) {
                return undefined
            }

            const payload = DynamoDBx.unmarshall<DbAggregate>(item)

            return this.createModel(payload)
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async multiDeleteById(keys: Array<DDBDeleteKey>): Promise<void> {
        try {
            if (keys.length) {
                await this.db.multiWriteItem({
                    Items: keys.map(key => ({
                        TableName: this.schema.tableName,
                        DeleteItem: {
                            Key: {
                                hk: {S: key.hashKey},
                                rk: {S: this.rk(key.id)},
                            },
                        },
                    })),
                })
            }
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async multiGet(options: MultiGetOptions): Promise<{[id: string]: T} | undefined> {
        if (options.index) {
            return this.multiGetByIndex(options)
        }

        try {
            const noDupRangeKeys = Array.from(new Set<string>(options.rangeKeys))
            const keyItems = noDupRangeKeys.map<DynamoDB.AttributeMap>(key => {
                return {
                    hk: {S: options.hashKey},
                    rk: {S: this.rk(key)},
                }
            })

            const items = await this.db.multiGetItem({
                TableName: this.schema.tableName,
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
                    const payload = DynamoDBx.unmarshall<DbAggregate>(item)

                    return this.createModel(payload)
                })
                .forEach(s => {
                    aggs[s.id] = s
                })

            return aggs
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async queryAll(options: QueryOptions): Promise<T[]> {
        try {
            const rkName = options.index ?? 'rk'
            const query = createKeyCondition(options.hashKey, rkName, options, this.prefixRangeKey)

            const items = await this.db.query({
                TableName: this.schema.tableName,
                IndexName: options.index,
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

            const models: T[] = []
            for (const item of items) {
                const payload = DynamoDBx.unmarshall<DbAggregate>(item)
                models.push(this.createModel(payload))
            }

            return models
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    protected async queryPage(options: QueryPageOptions): Promise<PageOutput<T>> {
        try {
            const rkName = options.index ?? 'rk'
            const query = createKeyCondition(options.hashKey, rkName, options, this.prefixRangeKey)

            const res = await this.db.queryPage({
                HashKey: 'hk',
                RangeKey: rkName,
                HashValue: options.hashKey,
                Token: options.token,
                Query: {
                    TableName: this.schema.tableName,
                    IndexName: options.index,
                    KeyConditionExpression: query.KeyConditionExpression,
                    ExpressionAttributeValues: query.ExpressionAttributeValues,
                    Limit: options.limit,
                    ConsistentRead: options.consistentRead ?? true,
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
                const payload = DynamoDBx.unmarshall<DbAggregate>(item)
                aggs.push(this.createModel(payload))
            }

            return {items: aggs, nextToken: res.NextToken}
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    private createModel(payload: any): T {
        const model = this.createFactory(payload.state)
        if (model instanceof Aggregate) {
            model.setTime(payload.time)
            model.setVersion(payload.version)
        }

        return model
    }

    private async getByIndex(options: GetOptions): Promise<T | undefined> {
        try {
            const query = createKeyCondition(options.hashKey, options.index as string, {
                index: options.index,
                hashKey: options.hashKey,
                rangeKey: {
                    eq: this.rk(options.rangeKey),
                },
                consistentRead: true,
            })

            const items = await this.db.query({
                TableName: this.schema.tableName,
                IndexName: options.index,
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

            return this.createModel(payload)
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    private async multiGetByIndex(options: MultiGetOptions): Promise<{[id: string]: T} | undefined> {
        try {
            const rangeKeys = Array.from(new Set<string>(options.rangeKeys))

            const items = await this.db.multiQuery(
                rangeKeys.map(rangeKey => ({
                    TableName: this.schema.tableName,
                    IndexName: options.index as string,
                    KeyConditionExpression: `hk = :hk and ${options.index as string} = :rk`,
                    ExpressionAttributeValues: {
                        ':hk': {S: options.hashKey},
                        ':rk': {S: this.rk(rangeKey)},
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
                    const payload = DynamoDBx.unmarshall<DbAggregate>(item)

                    return this.createModel(payload)
                })
                .forEach(s => {
                    aggs[s.id] = s
                })

            return aggs
        } catch (e) {
            throw new AppError(InternalError).withCause(e)
        }
    }

    private rk(key: string): string {
        if (this.prefixRangeKey) {
            return `${this.prefixRangeKey}-${key}`
        }

        return key
    }
}
