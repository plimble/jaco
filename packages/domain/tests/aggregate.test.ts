import {Aggregate} from '../src/lib/ddd/aggregate'

describe('Aggregate', () => {
    class B {
        id = ''
    }

    class AggA extends Aggregate {
        id = ''
        name = ''
        phone = 0
        email?: string = undefined
        b?: B = undefined

        protected check = false

        setName(name: string): void {
            this.name = name
        }
    }

    test('create Aggregate', () => {
        const a = new AggA()
        a.name = 'n1'
        a.setName('n1')
        expect(a.id).toBe('')
        expect(a.name).toBe('n1')
        expect(a.phone).toBe(0)
        expect(a.email).toBeUndefined()
        expect(a.b).toBeUndefined()
    })

    test('create Aggregate2', () => {
        const a = new AggA()
        a.name = 'n1'
        a.setName('n2')
        expect(a.id).toBe('')
        expect(a.name).toBe('n2')
        expect(a.phone).toBe(0)
        expect(a.email).toBeUndefined()
        expect(a.b).toBeUndefined()
    })
})
