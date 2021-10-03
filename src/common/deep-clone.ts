import copy from 'fast-copy'

export function deepClone<T = any>(data: T, isStrict = false): T {
    if (isStrict) {
        return copy.strictCopy(data)
    }

    return copy(data)
}
