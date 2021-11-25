import DynamoDB, {
    AttributeMap,
    DeleteRequest,
    ItemList,
    Key,
    KeysAndAttributes,
    PutRequest,
    QueryInput,
    ScanInput,
} from 'aws-sdk/clients/dynamodb'
import {JSONObject} from './json-object'
import {DynamoDBCursor} from './ddbx.cursor'
import {chunkArray, InternalError, Singleton} from '@onedaycat/jaco-common'
import {TransactionCanceled} from '../errors'

@Singleton()
export class DynamoDBx {
    static unmarshall<T>(data: DynamoDB.AttributeMap, options?: DynamoDB.Converter.ConverterOptions): T {
        return DynamoDB.Converter.unmarshall(data, options) as T
    }

    static createStringSet(values: string[]): DDbStringSet {
        return {
            type: 'String',
            values: Array.from(new Set(values)),
            wrapperName: 'Set',
        }
    }

    static createNumberSet(values: number[]): DDbNumberSet {
        return {
            type: 'Number',
            values: Array.from(new Set(values)),
            wrapperName: 'Set',
        }
    }

    static marshall(data: {[key: string]: any}, extra?: ExtraIndexKeys): DynamoDB.AttributeMap {
        if (extra) {
            for (const [key, val] of Object.entries(extra)) {
                data[key] = val
            }
        }

        return DynamoDB.Converter.marshall(JSONObject(data), {
            convertEmptyValues: false,
        })
    }

    protected client: DynamoDB

    constructor(client?: DynamoDB) {
        if (client) {
            this.client = client
        } else {
            this.client = new DynamoDB({
                maxRetries: 20,
            })
        }
    }

    async putItem(params: DynamoDB.Types.PutItemInput): Promise<DynamoDB.Types.PutItemOutput> {
        try {
            return await this.client.putItem(params).promise()
        } catch (e: any) {
            if (e.name === 'TransactionCanceledException') {
                throw new TransactionCanceled().withInput(params)
            }

            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async batchWriteItem(params: DynamoDB.Types.BatchWriteItemInput): Promise<DynamoDB.Types.BatchWriteItemOutput> {
        try {
            return await this.client.batchWriteItem(params).promise()
        } catch (e: any) {
            if (e.name === 'TransactionCanceledException') {
                throw new TransactionCanceled().withInput(params)
            }

            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async batchGetItem(params: DynamoDB.Types.BatchGetItemInput): Promise<DynamoDB.Types.BatchGetItemOutput> {
        try {
            return await this.client.batchGetItem(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async updateItem(params: DynamoDB.Types.UpdateItemInput): Promise<DynamoDB.Types.UpdateItemOutput> {
        try {
            return await this.client.updateItem(params).promise()
        } catch (e: any) {
            if (e.name === 'TransactionCanceledException') {
                throw new TransactionCanceled().withInput(params)
            }

            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async getItem(params: DynamoDB.Types.GetItemInput): Promise<AttributeMap | undefined> {
        try {
            const res = await this.client.getItem(params).promise()
            if (!res.Item) {
                return undefined
            }

            return res.Item
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async deleteItem(params: DynamoDB.Types.DeleteItemInput): Promise<DynamoDB.Types.DeleteItemOutput> {
        try {
            return await this.client.deleteItem(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async createTable(
        params: DynamoDB.Types.CreateTableInput,
        options: CreateTableOptions = {allowExist: true},
    ): Promise<DynamoDB.Types.CreateTableOutput> {
        try {
            return await this.client.createTable(params).promise()
        } catch (e: any) {
            if (options.allowExist && e.code === 'ResourceInUseException') {
                return {}
            }
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async deleteTable(
        params: DynamoDB.Types.DeleteTableInput,
        options: DeleteTableOptions = {allowNotFound: true},
    ): Promise<DynamoDB.Types.DeleteTableOutput> {
        try {
            return await this.client.deleteTable(params).promise()
        } catch (e: any) {
            if (options.allowNotFound && e.code === 'ResourceNotFoundException') {
                return {}
            }
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async transactWriteItems(
        params: DynamoDB.Types.TransactWriteItemsInput,
    ): Promise<DynamoDB.Types.TransactWriteItemsOutput> {
        try {
            return await this.client.transactWriteItems(params).promise()
        } catch (e: any) {
            if (e.name === 'TransactionCanceledException') {
                throw new TransactionCanceled().withInput(params)
            }

            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async transactGetItems(
        params: DynamoDB.Types.TransactGetItemsInput,
    ): Promise<DynamoDB.Types.TransactGetItemsOutput> {
        try {
            return await this.client.transactGetItems(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async query(params: DynamoDB.Types.QueryInput): Promise<ItemList> {
        try {
            if (params.Limit) {
                const res = await this.client.query(params).promise()
                if (res.Items?.length) {
                    return res.Items
                }

                return []
            }

            const items: DynamoDB.AttributeMap[] = []

            let next: Key | undefined = undefined
            do {
                params.ExclusiveStartKey = next
                const res = await this.client.query(params).promise()
                if (res.Items?.length) {
                    items.push(...res.Items)
                }
                next = res.LastEvaluatedKey
            } while (next)

            return items
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async multiQuery(params: DynamoDB.Types.QueryInput[]): Promise<ItemList> {
        const items: ItemList = []
        const resultList = await Promise.all(
            params.map(param => {
                return this.query(param)
            }),
        )

        for (const result of resultList) {
            if (result.length) {
                items.push(...result)
            }
        }

        return items
    }

    async queryPage(params: QueryPageInput): Promise<QueryPageOutput> {
        try {
            let lastEvaluatedKey: DynamoDB.AttributeMap | undefined
            let firstEvaluatedKey: DynamoDB.AttributeMap | undefined
            if (params.Token) {
                lastEvaluatedKey = DynamoDBCursor.decode(
                    params.HashKey,
                    params.RangeKey,
                    params.HashValue,
                    params.Token,
                )
            }
            const limit = params.Query.Limit ?? 20
            let items: ItemList = []

            while (Boolean) {
                params.Query.Limit = limit + 1
                if (lastEvaluatedKey) {
                    params.Query.ExclusiveStartKey = lastEvaluatedKey
                }

                const res = await this.client.query(params.Query).promise()

                if (res.Items) {
                    for (const item of res.Items) {
                        items.push(item)
                    }
                }

                lastEvaluatedKey = res.LastEvaluatedKey
                if (!firstEvaluatedKey && res.LastEvaluatedKey) {
                    firstEvaluatedKey = res.LastEvaluatedKey
                }

                if (items.length >= limit + 1 || !lastEvaluatedKey) {
                    break
                }
            }

            let nextToken: string | undefined = undefined
            if (items.length >= limit && firstEvaluatedKey) {
                items = items.slice(0, limit + 1)
                nextToken = DynamoDBCursor.create(items, limit, firstEvaluatedKey)
            }

            return {
                Items: items.length <= limit ? items : items.slice(0, limit),
                NextToken: nextToken,
            }
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async scanPage(params: ScanPageInput): Promise<ScanPageOutput> {
        try {
            params.Scan.Limit = params.Scan.Limit ?? 20
            if (params.lastEvaluatedKey) {
                params.Scan.ExclusiveStartKey = params.lastEvaluatedKey
            }

            const res = await this.client.scan(params.Scan).promise()

            if (!res.Items?.length) {
                return {Items: []}
            }

            return {
                Items: res.Items,
                lastEvaluatedKey: res.LastEvaluatedKey,
            }
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async multiWriteItem(params: MultiWriteItemInput, chunkSize = 25): Promise<void> {
        if (!params.Items.length) {
            return
        }

        try {
            const chunkedItems = chunkArray(params.Items, chunkSize)
            const batchList: Promise<any>[] = []

            let hasItem = false
            for (const items of chunkedItems) {
                hasItem = false
                const input: DynamoDB.Types.BatchWriteItemInput = {
                    RequestItems: {},
                }
                for (const item of items) {
                    hasItem = true
                    if (input.RequestItems[item.TableName]) {
                        if (item.PutItem) {
                            input.RequestItems[item.TableName].push({
                                PutRequest: item.PutItem,
                            })
                        } else {
                            input.RequestItems[item.TableName].push({
                                DeleteRequest: item.DeleteItem,
                            })
                        }
                    } else {
                        if (item.PutItem) {
                            input.RequestItems[item.TableName] = [{PutRequest: item.PutItem}]
                        } else {
                            input.RequestItems[item.TableName] = [{DeleteRequest: item.DeleteItem}]
                        }
                    }
                }

                if (hasItem) {
                    batchList.push(this.client.batchWriteItem(input).promise())
                }
            }

            if (batchList.length) {
                await Promise.all(batchList)
            }
        } catch (e: any) {
            if (e.name === 'TransactionCanceledException') {
                throw new TransactionCanceled().withInput(params)
            }

            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async multiGetItem(params: MultiGetItemInput, chunkSize = 100): Promise<ItemList> {
        if (!params.KeysAndAttributes.Keys.length) {
            return []
        }

        try {
            const chunkedKeys = chunkArray(params.KeysAndAttributes.Keys, chunkSize)
            const batchList: Promise<DynamoDB.Types.BatchGetItemOutput>[] = []

            for (const keys of chunkedKeys) {
                const input: DynamoDB.Types.BatchGetItemInput = {
                    RequestItems: {},
                }

                if (keys.length) {
                    input.RequestItems[params.TableName] = {
                        Keys: keys,
                        AttributesToGet: params.KeysAndAttributes.AttributesToGet,
                        ConsistentRead: params.KeysAndAttributes.ConsistentRead,
                        ProjectionExpression: params.KeysAndAttributes.ProjectionExpression,
                        ExpressionAttributeNames: params.KeysAndAttributes.ExpressionAttributeNames,
                    }
                    batchList.push(this.client.batchGetItem(input).promise())
                }
            }

            if (!batchList.length) {
                return []
            }

            const resList = await Promise.all(batchList)
            const items: ItemList = []

            for (const res of resList) {
                if (res.Responses) {
                    items.push(...res.Responses[params.TableName])
                }
            }

            return items
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }
}

export interface CreateTableOptions {
    /*
     * Do not throw exception when table already exist
     * */
    allowExist: boolean
}

export interface DeleteTableOptions {
    /*
     * Do not throw exception when table already deleted
     * */
    allowNotFound: boolean
}

export class LocalDynamoDBx extends DynamoDBx {
    constructor(endpoint = 'http://localhost:8000') {
        super(
            new DynamoDB({
                endpoint: endpoint,
                region: 'ap-southeast-1',
                accessKeyId: 'key',
                secretAccessKey: '12345678',
            }),
        )
    }
}

export type ExtraIndexKeys = {[key: string]: any}

export interface MultiWriteItemRequest {
    TableName: string
    PutItem?: PutRequest
    DeleteItem?: DeleteRequest
}

export interface MultiWriteItemInput {
    Items: MultiWriteItemRequest[]
}

export interface MultiGetItemInput {
    TableName: string
    KeysAndAttributes: KeysAndAttributes
}

export interface QueryPageInput {
    HashKey: string
    HashValue: string
    RangeKey: string
    Token?: string
    Query: QueryInput
}

export interface ScanPageInput {
    lastEvaluatedKey?: DynamoDB.AttributeMap
    Scan: ScanInput
}

export interface QueryPageOutput {
    Items: ItemList
    NextToken?: string
}

export interface ScanPageOutput {
    Items: ItemList
    lastEvaluatedKey?: DynamoDB.AttributeMap
}

export interface DDbStringSet {
    wrapperName: 'Set'
    values: string[]
    type: 'String'
}

export interface DDbNumberSet {
    wrapperName: 'Set'
    values: number[]
    type: 'Number'
}
