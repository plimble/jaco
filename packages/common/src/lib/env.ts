export abstract class Env {
    loadEnv(prefix: string): void {
        const startPrefix = `${prefix}_`
        for (const name of Object.keys(this)) {
            this[name] = process.env[startPrefix + name] ?? ''
        }
    }

    override(obj: Partial<Record<keyof this, string>>): void {
        for (const [name, value] of Object.entries(obj)) {
            this[name] = value
        }
    }
}
