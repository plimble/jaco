import {Dto} from '../lib/dto'

describe('Dto', () => {
    class YY {
        name = ''
    }

    class XX {
        a = ''
        b = new YY()
        c?: Map<string, YY>
        d = new Set<string>()

        #p = ''
        read(): void {
            this.#p = 'read'

            return
        }
    }

    test('should create an instance of Dto', () => {
        const dto = {
            a: '',
            b: {
                name: '',
            },
            c: {
                '1': {
                    name: '',
                },
            },
            d: ['1'],
        } as Dto<XX>

        expect(dto).toBeDefined()
    })
})
