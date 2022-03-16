import {Aggregate} from '../../src/lib/model/aggregate'
import {Props} from '@onedaycat/jaco-common'

describe('Aggregate', () => {
    describe('patch', () => {
        class Address extends Aggregate {
            readonly id!: string
            readonly address!: string
            readonly fullname!: FullName

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        class FullName extends Aggregate {
            readonly id!: string
            readonly firstName!: string
            readonly lastName!: string

            constructor(props: Props<FullName>) {
                super()
                Object.assign(this, props)
            }
        }

        test('changed', () => {
            const addr = new Address({
                id: '1',
                address: 'address',
                fullname: new FullName({
                    id: '1',
                    firstName: 'firstName',
                    lastName: 'lastName',
                }),
            })

            const changed = addr.patch(draft => {
                draft.fullname.firstName = 'newFirstName'
            })

            expect(changed).toBeTruthy()
            expect(addr.toObject()).toEqual({
                id: '1',
                address: 'address',
                fullname: {
                    id: '1',
                    firstName: 'newFirstName',
                    lastName: 'lastName',
                },
            })
        })

        test('not changed', () => {
            const addr = new Address({
                id: '1',
                address: 'address',
                fullname: new FullName({
                    id: '1',
                    firstName: 'firstName',
                    lastName: 'lastName',
                }),
            })

            const changed = addr.patch(draft => {
                draft.fullname.lastName = 'lastName'
            })

            expect(changed).toBeFalsy()
            expect(addr.toObject()).toEqual({
                id: '1',
                address: 'address',
                fullname: {
                    id: '1',
                    firstName: 'firstName',
                    lastName: 'lastName',
                },
            })
        })
    })

    test('toString', () => {
        class Address extends Aggregate {
            readonly id!: string
            readonly address: string = ''
            readonly money: number = 0
            readonly name: string = ''

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        const addr = new Address({
            id: '1',
            address: 'aaaa',
            money: 1000,
            name: 'name',
        })

        expect(addr.toString()).toEqual('{"address":"aaaa","money":1000,"name":"name","id":"1"}')
    })

    test('toObject', () => {
        class Address extends Aggregate {
            readonly id!: string
            readonly address: string = ''
            readonly money: number = 0
            readonly name: string = ''

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        const addr = new Address({
            id: '1',
            address: 'aaaa',
            money: 1000,
            name: 'name',
        })

        expect(addr.toObject()).toEqual({
            id: '1',
            address: 'aaaa',
            money: 1000,
            name: 'name',
        })
    })

    test('clone and equal', () => {
        class FullName extends Aggregate {
            readonly id!: string
            readonly firstName!: string
            private _lastName!: string

            constructor(props: Props<FullName>) {
                super()
                Object.assign(this, props)
            }

            setLastName(value: string) {
                this._lastName = value
            }
        }

        class Address extends Aggregate {
            readonly id!: string
            readonly address!: string
            readonly fullname!: FullName

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        const addr1 = new Address({
            id: '1',
            address: 'aaaa',
            fullname: new FullName({
                id: '1',
                firstName: 'firstName',
            }),
        })

        addr1.fullname.setLastName('lastname')
        const addr11 = addr1

        const addr2 = addr1.clone()
        const addr3 = addr1.clone()
        addr3.fullname.setLastName('newLastName')

        expect(addr1 === addr2).toBeFalsy()
        expect(addr1 === addr11).toBeTruthy()
        expect(addr1.equal(addr2)).toBeTruthy()
        expect(addr1.equal(addr11)).toBeTruthy()
        expect(addr1.equal(addr3)).toBeFalsy()
        expect(addr2).toBeInstanceOf(Address)
        expect(addr2.fullname).toBeInstanceOf(FullName)
    })
})
