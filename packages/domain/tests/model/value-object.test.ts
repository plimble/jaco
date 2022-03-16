import {ValueObject} from '../../src/lib/model/value-object'
import {DeepProps, Props} from '@onedaycat/jaco-common'

describe('ValueObject', () => {
    describe('patch', () => {
        class FullName extends ValueObject {
            readonly firstName!: string
            readonly lastName!: string

            constructor(props: Props<FullName>) {
                super()
                Object.assign(this, props)
            }
        }

        class Address extends ValueObject {
            readonly address!: string
            readonly fullname!: FullName

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        test('changed', () => {
            const addr = new Address({
                address: 'address',
                fullname: new FullName({
                    firstName: 'firstName',
                    lastName: 'lastName',
                }),
            })

            const changed = addr.patch(draft => {
                draft.fullname.firstName = 'newFirstName'
            })

            expect(changed).toBeTruthy()
            expect(addr.toObject()).toEqual({
                address: 'address',
                fullname: {
                    firstName: 'newFirstName',
                    lastName: 'lastName',
                },
            })
        })

        test('not changed', () => {
            const addr = new Address({
                address: 'address',
                fullname: new FullName({
                    firstName: 'firstName',
                    lastName: 'lastName',
                }),
            })

            const changed = addr.patch(draft => {
                draft.fullname.lastName = 'lastName'
            })

            expect(changed).toBeFalsy()
            expect(addr.toObject()).toEqual({
                address: 'address',
                fullname: {
                    firstName: 'firstName',
                    lastName: 'lastName',
                },
            })
        })
    })

    test('toString', () => {
        class Address extends ValueObject {
            readonly address: string = ''
            readonly money: number = 0
            readonly name: string = ''
            private _data = 0

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        const addr = new Address({
            address: 'aaaa',
            money: 1000,
            name: 'name',
        })

        expect(addr.toString()).toEqual('{"address":"aaaa","money":1000,"name":"name"}')
    })

    test('toObject', () => {
        class Address extends ValueObject {
            readonly address: string = ''
            readonly money: number = 0
            readonly name?: string = ''
            private _data = 0

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        const addr = new Address({
            address: 'aaaa',
            money: 1000,
            name: 'name',
        })

        expect(addr.toObject()).toEqual<DeepProps<Address>>({
            address: 'aaaa',
            money: 1000,
            name: 'name',
        })
    })

    test('clone and equal', () => {
        class FullName extends ValueObject {
            readonly firstName!: string
            private _lastName!: string

            constructor(props: Props<FullName>) {
                super()
                Object.assign(this, props)
            }

            getLastName() {
                return this._lastName
            }

            setLastName(value: string) {
                this._lastName = value
            }
        }

        class Address extends ValueObject {
            readonly address!: string
            readonly fullname!: FullName

            constructor(props: Props<Address>) {
                super()
                Object.assign(this, props)
            }
        }

        const addr1 = new Address({
            address: 'aaaa',
            fullname: new FullName({
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
