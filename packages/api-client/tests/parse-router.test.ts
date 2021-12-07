import {parseRouter} from '../src/lib/parse-router'
import path from 'path'

describe('Parse json schema', () => {
    test('parse', async () => {
        const schemas = await parseRouter(path.join(__dirname, 'data/routes.ts'))

        console.log(JSON.stringify(schemas, undefined, 4))
    })
})
