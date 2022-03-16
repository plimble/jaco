import {deepClone} from '../lib/utils'
import {classToPlain} from 'class-transformer'

describe('DeepClone', () => {
    abstract class Base {
        #d2!: string[]

        get d2(): string[] {
            return this.#d2
        }

        protected set d2(value: string[]) {
            this.#d2 = value
        }

        clone() {
            const x = deepClone(classToPlain(this))
            const xClass = this.constructor as any

            return new xClass(x.d1, deepClone(this.#d2))
        }
    }

    class Data extends Base {
        d1!: string

        constructor(d1: string, d2: string[]) {
            super()
            this.d1 = d1
            this.d2 = d2
        }
    }

    test('clone with private 2', () => {
        const data1 = new Data('d1', ['d2'])
        const data2 = data1.clone()

        expect(data1).toEqual(data2)
        expect(data1.d2).toEqual(data2.d2)
    })

    test('clone with private', () => {
        const data1 = new Data('d1', ['d2'])
        const obj1 = deepClone(classToPlain(data1))
        const data2 = new Data(obj1.d1, data1.d2)

        expect(data1).toEqual(data2)
        expect(data1.d2).toEqual(data2.d2)
    })

    test('clone no private', () => {
        const data1 = new Data('d1', ['d2'])
        const obj1 = deepClone(classToPlain(data1))
        const data2 = new Data(obj1.d1, obj1.d2)

        expect(data1).toEqual(data2)
        expect(data1.d2).not.toEqual(data2.d2)
    })
})
