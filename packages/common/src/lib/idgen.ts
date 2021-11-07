import cuid from 'cuid'

export class IdGen {
    static generate(): string {
        return IdGen.freezeId ?? cuid()
    }

    static freeze(id: string): void {
        IdGen.freezeId = id
    }

    static unfreeze(): void {
        IdGen.freezeId = undefined
    }

    private static freezeId?: string
}
