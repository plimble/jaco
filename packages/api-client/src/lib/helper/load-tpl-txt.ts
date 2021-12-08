import fs from 'fs'

export function loadTplTxt(path: string): string {
    return fs.readFileSync(path).toString('utf-8')
}
