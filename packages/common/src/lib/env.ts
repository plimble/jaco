export type EnvConfig = Record<string, any>

export function loadEnv<T extends Record<string, string>>(prefix: string): T {
    const result: Record<string, string> = {}
    const startPrefix = `${prefix}_`
    for (const [name, value] of Object.entries(process.env)) {
        if (name.startsWith(startPrefix)) {
            result[name.replace(startPrefix, '')] = value ?? ''
        }
    }

    return result as T
}
