export interface ProjectOptions {
    apiPaths?: string[]
    dynamodbPaths?: string[]
    reactorPaths?: string[]
    schedulePaths?: string[]

    publisherType?: 'kinesis' | 'sqs-fifo'
}
