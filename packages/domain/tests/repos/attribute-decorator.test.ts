import {Aggregate, Entity, marshallAttributes, unmarshallAttributes} from '@onedaycat/jaco-domain'
import {
    ArrayAttribute,
    Attribute,
    MapAttribute,
    ObjectAttribute,
    SetAttribute,
} from '../../src/lib/ddd/attribute-decorator'

describe('AggregateRepo', () => {
    class En extends Entity {
        @Attribute()
        id = 'e1'
    }

    class Agg extends Aggregate {
        @Attribute()
        id = ''

        @ArrayAttribute(En)
        listEn: En[] = []

        @MapAttribute(En)
        mapEn = new Map<string, En>()

        @SetAttribute()
        setEn = new Set<string>()

        @ObjectAttribute(En)
        en?: En

        @ObjectAttribute(En)
        enReq: En = new En()

        @ObjectAttribute(En, {
            toModel: (val: En) => {
                val.id = '10'

                return val
            },
        })
        toDb: En = new En()
    }

    test('Parse', async () => {
        const model1 = new Agg()
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
        })

        const model2 = unmarshallAttributes(Agg, data1)
        model1.toDb.id = '10'
        expect(model2).toEqual(model1)
    })
})
