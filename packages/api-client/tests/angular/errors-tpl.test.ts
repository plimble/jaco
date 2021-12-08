import {parseRouter} from '@onedaycat/jaco-api-client'
import path from 'path'
import {errorsTpl} from '../../src/lib/client-generator/angular/errors-tpl'

describe('Gen Angular', () => {
    test('gen error', async () => {
        const schemas = await parseRouter(path.join(__dirname, '../data/routes.ts'))
        const tpl = errorsTpl(schemas)
        expect(tpl).toBeDefined()
    })
})
