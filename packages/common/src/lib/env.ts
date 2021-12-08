export function overrideEnv<T>(env: T, obj: Partial<Record<keyof T, string>>): void {
    for (const [name, value] of Object.entries(obj)) {
        env[name] = value
    }
}

export function loadEnv(env: any, prefix: string) {
    const startPrefix = `${prefix}_`
    for (const name of Object.keys(env)) {
        env[name] = process.env[startPrefix + name] ?? ''
    }
}
