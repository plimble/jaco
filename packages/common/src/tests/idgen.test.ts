import {IdGen} from '../lib/idgen'

describe('IdGen', () => {
    beforeEach(() => {
        IdGen.unfreeze()
    })

    test('gen id', () => {
        expect(IdGen.generate()).toHaveLength(25)
    })

    test('Freeze and unfreeze id success', () => {
        const freezeId = 'idx'

        IdGen.freeze(freezeId)
        expect(IdGen.generate()).toEqual(freezeId)

        IdGen.unfreeze()
        expect(IdGen.generate()).not.toEqual(freezeId)
    })
})
