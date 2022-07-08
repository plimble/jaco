import {DomainEvent, isDomainEvent} from '@plimble/jaco-domain'
import {Clock, IdGen} from '@plimble/jaco-common'

describe('DomainEvent', () => {
    interface Payload {
        id: string
    }

    class TestEvent extends DomainEvent<Payload> {
        static TYPE = 'test'
    }

    class BadEvent extends DomainEvent<Payload> {
        static TYPE = 'bad'
    }

    test('create', () => {
        const now = Clock.new()
        IdGen.freeze('id1')
        Clock.freeze(now)

        const event = new TestEvent(TestEvent.TYPE, {
            id: '1',
        })

        expect(event).toEqual({
            id: 'id1',
            payload: {
                id: '1',
            },
            time: now,
            type: 'test',
        })

        expect(isDomainEvent(event, TestEvent)).toBe(true)
        expect(isDomainEvent(event, BadEvent)).toBe(false)
    })
})
