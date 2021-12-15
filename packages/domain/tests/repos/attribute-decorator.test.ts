import {
    ArrayAttribute,
    Attribute,
    Init,
    MapAttribute,
    marshallAttributes,
    ObjectAttribute,
    SetAttribute,
    unmarshallAttributes,
} from '../../src/lib/ddd/attribute-decorator'
import {Aggregate} from '../../src/lib/ddd/aggregate'
import {Entity} from '../../src/lib/ddd/entity'
import {Props} from '@onedaycat/jaco-common'

describe('AggregateRepo', () => {
    type UN = U1 | U2

    class U1 {
        @Attribute()
        type = 'u1'
    }

    class U2 {
        @Attribute()
        type = 'u2'
    }

    class En extends Entity {
        @Attribute()
        id = 'e1'

        hidden = '0'

        constructor(props?: Props<En>) {
            super()
            if (props) Object.assign(this, props)
        }
    }

    class Agg extends Aggregate {
        @Attribute()
        id!: string

        @ArrayAttribute(En)
        listEn!: En[]

        @MapAttribute(En)
        mapEn!: Map<string, En>

        @SetAttribute()
        setEn!: Set<string>

        @ObjectAttribute(En)
        en?: En

        @ObjectAttribute(En)
        enReq!: En

        @ObjectAttribute(En, {
            toModel: (val: En) => {
                val.id = '10'

                return val
            },
        })
        toDb!: En

        hidden!: number

        @ObjectAttribute({field: 'type', types: {u1: U1, u2: U2}})
        un!: UN

        constructor(props: Props<Agg>) {
            super()
            Object.assign(this, props)
        }

        @Init()
        init() {
            this.hidden = 1
        }
    }

    test('Parse', async () => {
        const model1 = new Agg({
            enReq: new En(),
            hidden: 0,
            id: '',
            listEn: [],
            mapEn: new Map(),
            setEn: new Set(),
            toDb: new En(),
            un: new U2(),
        })
        model1.id = 'a1'
        model1.listEn.push(new En(), new En())
        model1.mapEn.set('k1', new En())
        model1.mapEn.set('k2', new En())
        model1.setEn.add('s1')
        model1.setEn.add('s2')
        model1.enReq.id = 'e2'

        const data1 = marshallAttributes(Agg, model1)
        expect(data1).toEqual({
            id: 'a1',
            listEn: [{id: 'e1'}, {id: 'e1'}],
            mapEn: {
                k1: {id: 'e1'},
                k2: {id: 'e1'},
            },
            setEn: ['s1', 's2'],
            enReq: {id: 'e2'},
            toDb: {id: 'e1'},
            un: {type: 'u2'},
        })

        const model2 = unmarshallAttributes(Agg, data1)
        model1.toDb.id = '10'
        model1.hidden = 1
        expect(model2).toEqual(model1)
        expect(model2.un).toBeInstanceOf(U2)
    })
})
