import {Clock, IdGen} from '@onedaycat/jaco-common'

export interface DomainEvent<T extends string = any, K = any> {
    id: string
    type: T
    payload: K
    time: number
}

export interface ParsedDomainEvent<T extends DomainEvent = DomainEvent> {
    event: T
    seqNumber: string
}

export function isDomainEvent<T extends DomainEvent>(event: any, type: T['type']): event is T {
    return event.type === type
}

export function createDomainEvent<T extends DomainEvent = DomainEvent>(type: T['type'], payload: T['payload']): T {
    return {
        id: IdGen.generate(),
        type: type,
        payload: payload,
        time: Clock.new(),
    } as T
}
