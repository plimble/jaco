import {HttpClient} from '@onedaycat/jaco-http'

describe('Http', () => {
    const client = new HttpClient()

    test.skip('google', async () => {
        const res = await client.request({url: 'https://google.com', method: 'GET', path: '/'})

        expect(res.status).toEqual(200)
    })
})
