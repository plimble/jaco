export function listToMap<T>(arr: T[], keyFn: (data: T) => string): Map<string, T> {
    const result = new Map<string, T>()
    for (const item of arr) {
        result.set(keyFn(item), item)
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
