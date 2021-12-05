import {EventTarget} from './interfaces'
import {KinesisPublisher} from './publisher/kinesis.publisher'
import {SNSPublisher} from './publisher/sns.publisher'
import {SnsFifoPublisher} from './publisher/sns-fifo.publisher'
import {container, Singleton, wrapError} from '@onedaycat/jaco-common'
import {DomainEvent} from '../ddd/domain-event'

export interface EventPublisherOptions {
    targets: EventTarget[]
}

@Singleton()
export class EventPublisher {
    private readonly targets: EventTarget[]

    constructor(options?: EventPublisherOptions) {
        if (options) {
            this.targets = options.targets
        } else {
            this.targets = []
        }
    }

    async publish(events: Array<DomainEvent>, groupId?: string): Promise<void> {
        if (!this.targets.length) return

        try {
            await Promise.all(
                this.targets.map(target => {
                    const filteredEvents = events.filter(e => {
                        if (target.excludeEvents && target.excludeEvents.length) {
                            if (target.excludeEvents.includes(e.type)) {
                                return false
                            }
                        }

                        if (target.includeEvents && target.includeEvents.length) {
                            return target.includeEvents.includes(e.type)
                        }

                        return true
                    })

                    if (filteredEvents.length) {
                        switch (target.type) {
                            case 'Kinesis':
                                return container.resolve(KinesisPublisher).publish(target, filteredEvents, groupId)
                            case 'SNS':
                                return container.resolve(SNSPublisher).publish(target, filteredEvents)
                            case 'SNSFifo':
                                return container.resolve(SnsFifoPublisher).publish(target, filteredEvents, groupId)
                        }
                    }

                    return Promise.resolve()
                }),
            )
        } catch (e) {
            throw wrapError(e).withInput(events)
        }
    }
}
