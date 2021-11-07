import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {ExceptionCode, HttpException} from './exceptions'

dayjs.extend(utc)

export interface RangeFromTo {
    from: number
    to: number
}

export class Clock {
    static toRFC3339(timestamp: number, omitTime = false): string {
        const date = new Date(timestamp * 1000)

        if (omitTime) {
            return date.getUTCFullYear().toString() +
                '-' + Clock.pad(date.getUTCMonth() + 1) +
                '-' + Clock.pad(date.getUTCDate())
        }

        return date.getUTCFullYear().toString() +
            '-' + Clock.pad(date.getUTCMonth() + 1) +
            '-' + Clock.pad(date.getUTCDate()) +
            'T' + Clock.pad(date.getUTCHours()) +
            ':' + Clock.pad(date.getUTCMinutes()) +
            ':' + Clock.pad(date.getUTCSeconds()) +
            'Z'
    }

    static format(timestamp: number, formatStr: string | undefined = undefined, timezone = 0): string {
        if (timezone === 0) {
            return dayjs.utc(timestamp * 1000).format(formatStr)
        }

        return dayjs.utc(timestamp * 1000).utcOffset(timezone).format(formatStr)
    }

    static parse(dateTime: string, format: string | undefined = undefined): number {
        const date = dayjs(dateTime, format)
        if (!date.isValid()) {
            throw HttpException.fromCode(ExceptionCode.InternalError, 'Invalid date time format')
        }

        return date.utc().unix()
    }

    static freeze(timestamp: number): void {
        Clock.freezeDate = timestamp
    }

    static new(date?: string): number {
        if (Clock.freezeDate) {
            return Clock.freezeDate
        }

        if (date) {
            return Math.round(Date.parse(date) / 1000)
        }

        return Math.round(Date.now() / 1000)
    }

    static diffDate(beforeTs: number, afterTs: number): number {
        return afterTs - beforeTs
    }

    static diffDateIn(
        beforeTs: number,
        afterTs: number,
        type: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    ): number {
        return dayjs.utc(afterTs * 1000).diff(dayjs.utc(beforeTs * 1000), type)
    }

    static add(
        timestamp: number,
        duration: number,
        type: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    ): number {
        return dayjs.utc(timestamp * 1000).add(duration, type).unix()
    }

    static sub(
        timestamp: number,
        duration: number,
        type: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    ): number {
        return dayjs.utc(timestamp * 1000).subtract(duration, type).unix()
    }

    static set(
        timestamp: number,
        duration: number,
        type: 'year' | 'month' | 'date' | 'hour' | 'minute' | 'second',
        offset = 0,
    ): number {
        if (type === 'month') {
            return dayjs.utc(timestamp * 1000).utcOffset(offset).set(type, duration - 1).unix()
        }

        return dayjs.utc(timestamp * 1000).utcOffset(offset).set(type, duration).unix()
    }

    static get(timestamp: number, type: 'year' | 'month' | 'date' | 'hour' | 'minute' | 'second', offset = 0): number {
        if (type === 'month') {
            return dayjs.utc(timestamp * 1000).utcOffset(offset).get(type) + 1
        }

        return dayjs.utc(timestamp * 1000).utcOffset(offset).get(type)
    }

    static startOf(timestamp: number, type: 'day' | 'month' | 'week' | 'year', offset: number): number {
        return dayjs.utc(timestamp * 1000).utcOffset(offset).startOf(type).unix()
    }

    static endOf(timestamp: number, type: 'day' | 'month' | 'week' | 'year', offset: number): number {
        return dayjs.utc(timestamp * 1000).utcOffset(offset).endOf(type).unix()
    }

    static splitTime(
        start: number,
        to: number,
        range: number,
        type: 'day' | 'hr' | 'min' | 'sec',
    ): RangeFromTo[] {
        const diffSec = Clock.diffDate(start, to)

        const secType = Clock.getSecFromType(type)
        const rangeSec = secType * range

        if (diffSec <= rangeSec) {
            return [
                {
                    from: start,
                    to: to,
                },
            ]
        }

        const count = Math.ceil(diffSec / rangeSec)

        const result: RangeFromTo[] = []

        let lastTo = to
        for (let i = 1; i <= count; i++) {
            const from = to - (rangeSec * i)
            result.push({
                from: from,
                to: lastTo,
            })

            lastTo = from
        }
        result[result.length - 1].from = start

        return result
    }

    static unfreeze(): void {
        Clock.freezeDate = undefined
    }

    private static freezeDate: number | undefined

    private static getSecFromType(type: | 'day' | 'hr' | 'min' | 'sec'): number {
        switch (type) {
            case 'day':
                return 86400
            case 'hr':
                return 3600
            case 'min':
                return 60
            case 'sec':
                return 1
        }

        return 1
    }

    private static pad(n: number): string {
        if (n < 10) {
            return '0' + n.toString()
        }

        return n.toString()
    }
}
