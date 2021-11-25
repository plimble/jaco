import {DomainEvent} from './domain-event'
import produce, {Draft} from 'immer'
import {Constructor} from '@onedaycat/jaco-common'
import {Id} from './id'

export interface AggregateState {
    id: Id | string
}

export interface AggregatePayload<T extends AggregateState = AggregateState> {
    time: number
    version: number
    state: T
}

export abstract class Aggregate<T extends AggregateState = AggregateState> {
    protected version = 0
    protected time = 0
    protected abstract state: T
    private changedEvents: Array<DomainEvent> = []

    getId(): string {
        return this.state.id.toString()
    }

    getVersion(): number {
        return this.version
    }

    getTime(): number {
        return this.time
    }

    loadAggregate(payload: AggregatePayload<T>): void {
        this.version = payload.version
        this.time = payload.time
        this.state = payload.state
    }

    setVersion(version: number, time: number): void {
        this.version = version
        this.time = time
    }

    getUncommitted(): Array<DomainEvent> {
        return this.changedEvents
    }

    hasChanged(): boolean {
        return this.changedEvents.length > 0
    }

    hasEvent(eventClass: Constructor<DomainEvent>): boolean {
        return this.changedEvents.some(event => event instanceof eventClass)
    }

    getState(): Readonly<T> {
        return this.state
    }

    patchState(draftFn: (draft: Draft<T>) => any): boolean {
        const newState = produce(this.state, draftFn)

        if (this.state !== newState) {
            this.state = newState

            return true
        }

        return false
    }

    applyChange<K extends DomainEvent>(event: K): void {
        this.changedEvents.push(event)
        this.version = this.version + 1
        this.time = event.time
    }

    commit(): DomainEvent[] | undefined {
        if (this.changedEvents.length) {
            const events: DomainEvent[] = [...this.changedEvents]

            this.changedEvents.length = 0

            return events
        }

        return undefined
    }

    isNew(): boolean {
        return this.version === 0
    }

    toJSON(): Readonly<AggregatePayload<T>> {
        return {
            time: this.time,
            state: this.state,
            version: this.version,
        }
    }

    toString(): string {
        return JSON.stringify(this)
    }

    setState(state: T): void {
        this.state = state
    }
}
