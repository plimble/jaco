import S3 from 'aws-sdk/clients/s3'
import {AppError, chunkArray, InternalError, Singleton, wrapError} from '@onedaycat/jaco-common'

@Singleton()
export class S3X {
    protected client: S3

    constructor(client?: S3) {
        if (client) {
            this.client = client
        } else {
            this.client = new S3({
                maxRetries: 5,
            })
        }
    }

    async createBucket(params: S3.CreateBucketRequest): Promise<S3.CreateBucketOutput> {
        try {
            return await this.client.createBucket(params).promise()
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput(params)
        }
    }

    async deleteBucket(params: S3.DeleteBucketRequest): Promise<void> {
        try {
            await this.client.deleteBucket(params).promise()
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput(params)
        }
    }

    async deleteFolder(bucketName: string, folder: string): Promise<void> {
        try {
            let token: string | undefined = undefined
            const keys: string[] = []

            do {
                const result = await this.client
                    .listObjectsV2({
                        Bucket: bucketName,
                        Prefix: folder,
                        ContinuationToken: token,
                    })
                    .promise()

                if (!result.Contents) {
                    break
                }

                result.Contents.forEach(content => {
                    if (content.Key) {
                        keys.push(content.Key)
                    }
                })

                token = result.NextContinuationToken
            } while (token)

            await this.multiDelete(bucketName, keys)
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput({bucketName, folder})
        }
    }

    async put(bucketName: string, key: string, data: Buffer | string): Promise<void> {
        const params: S3.PutObjectRequest = {
            Bucket: bucketName,
            Key: key,
            Body: data,
        }
        try {
            await this.client.putObject(params).promise()
        } catch (e) {
            throw new AppError(InternalError).withCause(wrapError(e)).withInput(params)
        }
    }

    async delete(bucketName: string, key: string): Promise<void> {
        const params: S3.DeleteObjectRequest = {
            Bucket: bucketName,
            Key: key,
        }
        try {
            await this.client.deleteObject(params).promise()
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput(params)
        }
    }

    async multiDelete(bucketName: string, keys: string[]): Promise<void> {
        const keyChunks = chunkArray(keys, 500)
        try {
            await Promise.all(
                keyChunks.map(keys => {
                    return this.client
                        .deleteObjects({
                            Bucket: bucketName,
                            Delete: {
                                Objects: keys.map<S3.ObjectIdentifier>(k => {
                                    return {Key: k}
                                }),
                            },
                        })
                        .promise()
                }),
            )
        } catch (e) {
            throw new AppError(InternalError).withCause(e).withInput({bucketName, keys})
        }
    }
}

export class LocalS3X extends S3X {
    constructor(endpoint = 'http://localhost:9000') {
        super(
            new S3({
                endpoint: endpoint,
                accessKeyId: 'key',
                secretAccessKey: '12345678',
                region: 'ap-southeast-1',
                s3ForcePathStyle: true,
            }),
        )
    }
}
