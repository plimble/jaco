import copy from 'fast-copy'
import {deepEqual as fastDeepEqual} from 'fast-equals'
import {Constructor} from './types'

export function chunkArray<T>(arr: T[], size: number): T[][] {
    const arrT: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
        arrT.push(arr.slice(i, i + size))
    }

    return arrT
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function deepClone<T = any>(data: T, isStrict = false): T {
    if (isStrict) {
        return copy.strictCopy(data)
    }

    return copy(data)
}

export function deepEqual(a: any, b: any): boolean {
    return fastDeepEqual(a, b)
}

export function listToMap<T>(arr: T[], keyFn: (data: T) => string): Map<string, T> {
    const result = new Map<string, T>()
    for (const item of arr) {
        result[keyFn(item)] = item
    }

    return result
}

export function listToRecord<T>(arr: T[], keyFn: (data: T) => string): Record<string, T> {
    const result: Record<string, T> = {}
    for (const item of arr) {
        result[keyFn(item)] = item
    }

    return result
}

const regEx = /[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g

export function removeSpecialChar(str: string) {
    return str.replace(regEx, ' ').split(' ').filter(Boolean).join(' ')
}

export function createClass<T>(c: Constructor<T>, data: T): T {
    return Object.assign(new c(), data) as T
}
