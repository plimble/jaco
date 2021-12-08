import {loadTplTxt} from '../../src/lib/helper/load-tpl-txt'
import path from 'path'

describe('Gen Angular', () => {
    test('gen utils', async () => {
        const tpl = loadTplTxt(path.join(__dirname, '../../src/lib/client-generator/angular/utils-tpl.txt'))
        expect(tpl).toBeDefined()
    })
})
