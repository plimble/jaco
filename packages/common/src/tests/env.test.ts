import {loadEnv, overrideEnv} from '../../src/lib/env'

class TestEnv {
    name = ''
    db = ''
    timeZone = ''
    miss = ''

    constructor() {
        loadEnv(this, 'X')
    }
}

describe('Env', () => {
    process.env.X_name = 'name'
    process.env.X_db = 'db'
    process.env.X_timeZone = 'timeZone'

    test('load env', () => {
        const env = new TestEnv()

        expect(env.name).toEqual(process.env.X_name)
        expect(env.db).toEqual(process.env.X_db)
        expect(env.timeZone).toEqual(process.env.X_timeZone)
        expect(env.miss).toEqual('')
    })

    test('override env', () => {
        const env = new TestEnv()
        overrideEnv(env, {
            miss: '1',
            name: '2',
        })

        expect(env.name).toEqual('2')
        expect(env.db).toEqual(process.env.X_db)
        expect(env.timeZone).toEqual(process.env.X_timeZone)
        expect(env.miss).toEqual('1')
    })
})
