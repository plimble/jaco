import {chunkArray, removeSpecialChar} from '../lib/utils'

describe('utils', () => {
    test('ChunkArray success', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7]

        expect(chunkArray<number>(arr, 2)).toEqual([[1, 2], [3, 4], [5, 6], [7]])
    })

    test('remove special character', () => {
        const result = removeSpecialChar('a[[b]กข ค 0 false 1')

        expect(result).toEqual('a b กข ค 0 false 1')
    })
})
