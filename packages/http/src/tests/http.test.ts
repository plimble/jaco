import {HttpClient} from '../lib/http'

describe('Http', () => {
    const client = new HttpClient()

    test.skip('google', async () => {
        const res = await client.request({url: 'https://google.com', method: 'GET', path: '/'})

        expect(res.status).toEqual(200)
    })

    test.skip('google timeout', async () => {
        const res = await client.request({url: 'https://google.com', method: 'GET', path: '/', timeout: 10})

        expect(res.status).toEqual(200)
    })
})
