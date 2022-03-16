import {Clock} from '../lib/clock'

describe('Clock', () => {
    beforeEach(() => {
        Clock.unfreeze()
    })

    test('Freeze and unfreeze clock success', () => {
        const freezeTime = 1589958111
        const newTime = '1589958222000'

        Clock.freeze(freezeTime)
        expect(Clock.new(newTime)).toEqual(freezeTime)

        Clock.unfreeze()
        expect(Clock.new(newTime)).toEqual(Math.round(Date.parse(newTime) / 1000))
    })

    test('Diffdate success', () => {
        expect(Clock.diffDate(1, 10)).toEqual(9)
    })

    describe('Add timestamp', () => {
        test('Add month success', () => {
            const time1 = 1589958111
            const time2 = Clock.add(time1, 2, 'month')

            const diff = new Date(time2 * 1000).getMonth() - new Date(time1 * 1000).getMonth()
            expect(diff).toEqual(2)
        })

        test('Add day success', () => {
            const time1 = 1589958111
            const time2 = Clock.add(time1, 2, 'day')

            const diff = new Date(time2 * 1000).getDate() - new Date(time1 * 1000).getDate()
            expect(diff).toEqual(2)
        })

        test('Add hr success', () => {
            const time1 = 1589958111
            const time2 = Clock.add(time1, 2, 'hour')

            const diff = new Date(time2 * 1000).getHours() - new Date(time1 * 1000).getHours()
            expect(diff).toEqual(2)
        })

        test('Add min success', () => {
            const time1 = 1589958111
            const time2 = Clock.add(time1, 2, 'minute')

            const diff = new Date(time2 * 1000).getMinutes() - new Date(time1 * 1000).getMinutes()
            expect(diff).toEqual(2)
        })

        test('Add sec success', () => {
            const time1 = 1589958111
            const time2 = Clock.add(time1, 2, 'second')

            const diff = new Date(time2 * 1000).getSeconds() - new Date(time1 * 1000).getSeconds()
            expect(diff).toEqual(2)
        })
    })
    describe('Sub timestamp', () => {
        test('Sub month success', () => {
            const time1 = 1589958111
            const time2 = Clock.sub(time1, 2, 'month')

            const diff = new Date(time1 * 1000).getMonth() - new Date(time2 * 1000).getMonth()
            expect(diff).toEqual(2)
        })
        test('Sub day success', () => {
            const time1 = 1589958111
            const time2 = Clock.sub(time1, 2, 'day')

            const diff = new Date(time1 * 1000).getDate() - new Date(time2 * 1000).getDate()
            expect(diff).toEqual(2)
        })
        test('Sub hr success', () => {
            const time1 = 1589958111
            const time2 = Clock.sub(time1, 2, 'hour')

            const diff = new Date(time1 * 1000).getHours() - new Date(time2 * 1000).getHours()
            expect(diff).toEqual(2)
        })
        test('Sub min success', () => {
            const time1 = 1589958222
            const time2 = Clock.sub(time1, 2, 'minute')

            const diff = new Date(time1 * 1000).getMinutes() - new Date(time2 * 1000).getMinutes()
            expect(diff).toEqual(2)
        })
        test('Sub sec success', () => {
            const time1 = 1589958111
            const time2 = Clock.sub(time1, 2, 'second')

            const diff = new Date(time1 * 1000).getSeconds() - new Date(time2 * 1000).getSeconds()
            expect(diff).toEqual(2)
        })

        test('start of', () => {
            const time1 = 1589958111
            const time2 = Clock.startOf(time1, 'day', 7)

            expect(Clock.format(time1)).toEqual('2020-05-20T07:01:51Z')
            expect(Clock.format(time2)).toEqual('2020-05-19T17:00:00Z')
        })
    })

    describe('splitTime', () => {
        test('less than range', () => {
            const from = Clock.sub(Clock.new(), 1, 'day')
            const now = Clock.new()

            const res = Clock.splitTime(from, now, 10, 'day')
            expect(res.length).toEqual(1)
            expect(res[0].from).toEqual(from)
            expect(res[0].to).toEqual(now)
        })

        test('greater than range', () => {
            const from = Clock.sub(Clock.new(), 87, 'day')
            const now = Clock.new()

            const res = Clock.splitTime(from, now, 15, 'day')
            expect(res.length).toEqual(6)

            expect(res[0].from).toEqual(Clock.sub(now, 15, 'day'))
            expect(res[0].to).toEqual(now)

            expect(res[1].from).toEqual(Clock.sub(now, 30, 'day'))
            expect(res[1].to).toEqual(Clock.sub(now, 15, 'day'))

            expect(res[2].from).toEqual(Clock.sub(now, 45, 'day'))
            expect(res[2].to).toEqual(Clock.sub(now, 30, 'day'))

            expect(res[3].from).toEqual(Clock.sub(now, 60, 'day'))
            expect(res[3].to).toEqual(Clock.sub(now, 45, 'day'))

            expect(res[4].from).toEqual(Clock.sub(now, 75, 'day'))
            expect(res[4].to).toEqual(Clock.sub(now, 60, 'day'))

            expect(res[5].from).toEqual(Clock.sub(now, 87, 'day'))
            expect(res[5].to).toEqual(Clock.sub(now, 75, 'day'))
        })
    })

    describe('diffDateIn', () => {
        test('Day', () => {
            const before = Clock.startOf(Clock.parse('2021-07-23T11:00:00+07:00'), 'day', 0)
            const after = Clock.startOf(Clock.parse('2021-08-05T12:00:00+07:00'), 'day', 0)
            const diff = Clock.diffDateIn(before, after, 'day')
            expect(diff).toEqual(13)
        })

        test('Day-2', () => {
            const before = Clock.startOf(Clock.parse('2021-02-05T11:00:00+07:00'), 'day', 0)
            const after = Clock.startOf(Clock.parse('2021-03-05T12:00:00+07:00'), 'day', 0)
            const diff = Clock.diffDateIn(before, after, 'day')
            expect(diff).toEqual(28)
        })

        test('Day-3', () => {
            const before = Clock.startOf(Clock.parse('2021-03-01T11:00:00+07:00'), 'day', 7)
            const after = Clock.startOf(Clock.add(before, 30, 'day'), 'day', 7)
            expect(after).toEqual(Clock.parse('2021-03-31T00:00:00+07:00'))
        })
    })

    describe('set', () => {
        test('set date offset 7', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.set(time, 28, 'date', 7)
            expect(Clock.format(result, undefined, 7)).toEqual('2021-02-28T17:18:19+07:00')
        })

        test('set month', () => {
            const time = Clock.parse('2021-02-23T00:18:19+07:00')
            const result = Clock.set(time, 12, 'month', 0)
            expect(Clock.format(result)).toEqual('2021-12-22T17:18:19Z')
        })

        test('set year', () => {
            const time = Clock.parse('2021-02-23T00:18:19+07:00')
            const result = Clock.set(time, 2025, 'year')
            expect(Clock.format(result)).toEqual('2025-02-22T17:18:19Z')
        })

        test('set hour offset 7', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.set(time, 11, 'hour', 7)
            expect(Clock.format(result, undefined, 7)).toEqual('2021-02-23T11:18:19+07:00')
        })

        test('set minute offset 7', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.set(time, 11, 'minute', 7)
            expect(Clock.format(result, undefined, 7)).toEqual('2021-02-23T17:11:19+07:00')
        })

        test('set second offset 7', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.set(time, 11, 'second', 7)
            expect(Clock.format(result, undefined, 7)).toEqual('2021-02-23T17:18:11+07:00')
        })
    })

    describe('get', () => {
        test('get date', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.get(time, 'date', 7)
            expect(result).toEqual(23)
        })

        test('get month', () => {
            const time = Clock.parse('2021-01-23T17:18:19+07:00')
            const result = Clock.get(time, 'month', 7)
            expect(result).toEqual(1)
        })

        test('get year', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.get(time, 'year', 7)
            expect(result).toEqual(2021)
        })

        test('get hour', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.get(time, 'hour', 7)
            expect(result).toEqual(17)
        })

        test('get minute', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.get(time, 'minute', 7)
            expect(result).toEqual(18)
        })

        test('get second', () => {
            const time = Clock.parse('2021-02-23T17:18:19+07:00')
            const result = Clock.get(time, 'second', 7)
            expect(result).toEqual(19)
        })
    })
})
