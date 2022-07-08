import 'reflect-metadata'
import {Clock, IdGen} from '@plimble/jaco-common'

export abstract class Message<T extends Record<string, any> = Record<string, any>> {
    id: string
    type: string
    payload: T
    time: number

    protected constructor(type: string, payload: T, id?: string, time?: number) {
        this.id = id ?? IdGen.generate()
        this.time = time ?? Clock.new()
        this.payload = payload
        this.type = type
    }

    abstract groupId(): string | undefined
}

export interface MessagePayload<T extends Record<string, any> = Record<string, any>> {
    id: string
    type: string
    payload: T
}

export interface ReactorMessage<T extends MessagePayload = MessagePayload> {
    message: T
    seqNumber: string
}

export function isMessage<T extends Message>(payload: MessagePayload, type: string): payload is T {
    return payload.type === type
}
