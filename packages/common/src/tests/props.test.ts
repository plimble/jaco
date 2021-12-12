import {Dto, Props} from '../lib/props'

describe('Props', () => {
    class YY {
        name = ''
    }

    class XX {
        a!: string
        b!: YY
        c?: Map<string, YY>
        d!: Set<string>

        #p = ''

        private q = ''

        constructor(props: Props<XX>) {
            Object.assign(this, props)
        }

        getQ(): string {
            return this.q
        }

        getP(): string {
            return this.#p
        }

        read(): void {
            this.#p = 'read'
            this.q = 'read'

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

    test('should create an instance of Props', () => {
        const xx = new XX({
            a: '',
            b: new YY(),
            c: new Map<string, YY>(),
            d: new Set(['1']),
        })

        xx.read()

        expect(xx).toBeDefined()
        expect(xx).toBeInstanceOf(XX)
        expect(xx.a).toEqual('')
        expect(xx.b).toBeInstanceOf(YY)
        expect(xx.c).toBeInstanceOf(Map)
        expect(xx.d).toBeInstanceOf(Set)
        expect(xx.getP()).toEqual('read')
        expect(xx.getQ()).toEqual('read')
    })
})
