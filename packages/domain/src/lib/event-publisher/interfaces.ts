import {DomainEvent} from '../ddd/domain-event'

export interface Publisher {
    publish(setup: EventTarget, events: Array<DomainEvent>, groupId?: string): Promise<void>
}

export interface KinesisTarget {
    type: 'Kinesis'
    streamName: string
    includeEvents?: string[]
    excludeEvents?: string[]
    tags?: Record<string, any>
    groupKey?: string
}

export interface SNSTarget {
    type: 'SNS'
    topicArn: string
    includeEvents?: string[]
    excludeEvents?: string[]
    tags?: Record<string, any>
}

export interface SNSFifoTarget {
    type: 'SNSFifo'
    topicArn: string
    includeEvents?: string[]
    excludeEvents?: string[]
    tags?: Record<string, any>
    groupKey?: string
}

export type EventTarget = KinesisTarget | SNSTarget | SNSFifoTarget
