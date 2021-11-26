import DynamoDB from 'aws-sdk/clients/dynamodb'
import {AppError, ValidateError} from '@onedaycat/jaco-common'

export class DynamoDBCursor {
    static create(
        items: DynamoDB.AttributeMap[],
        limit: number,
        lastEvalKey?: DynamoDB.AttributeMap,
    ): string | undefined {
        if (items.length > limit) {
            items = items.slice(0, limit)
        } else {
            return undefined
        }

        if (lastEvalKey == null) {
            return undefined
        }
        const last = items[items.length - 1]
        const crs: string[] = []
        const keys = Object.keys(lastEvalKey)
        for (const key of keys) {
            switch (true) {
                case lastEvalKey[key].S != null:
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    crs.push(`S${key}$${last[key].S}`)
                    break
                case lastEvalKey[key].N != null:
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    crs.push(`N${key}$${last[key].N}`)
                    break
                case lastEvalKey[key].NULL != null:
                    crs.push(`L${key}$`)
                    break
                case lastEvalKey[key].BOOL != null:
                    crs.push(`B${key}$${last[key].BOOL ? '!t' : '!f'}`)
                    break
                default:
                    throw new AppError(
                        500,
                        'videl.CreateDdbCursorError',
                        'lastEvalKey not suuported for create cursor',
                    ).withInput(lastEvalKey)
            }
        }

        return Buffer.from(crs.join('|')).toString('base64')
    }

    static decode(hkKey: string, rkKey: string, hkValue: string, token: string): DynamoDB.AttributeMap {
        const keys = Buffer.from(token, 'base64').toString().split('|')
        const lastEvalKey: DynamoDB.AttributeMap = {}

        keys.forEach(k => {
            const vals = k.split('$')
            if (vals.length !== 2) {
                throw new AppError(500, 'videl.InvalidTokenCursor', 'Cursor token is invalid').withInput(token)
            }

            switch (vals[0].charAt(0)) {
                case 'B':
                    lastEvalKey[vals[0].substr(1, vals[0].length)] = {BOOL: vals[1] === '!t'}
                    break
                case 'L':
                    lastEvalKey[vals[0].substr(1, vals[0].length)] = {NULL: true}
                    break
                case 'S':
                    lastEvalKey[vals[0].substr(1, vals[0].length)] = {S: vals[1]}
                    break
                case 'N':
                    lastEvalKey[vals[0].substr(1, vals[0].length)] = {N: vals[1]}
                    break
                default:
                    throw new AppError(
                        500,
                        'videl.ParseDdbCursorToken',
                        'token not suuported for parse cursor',
                    ).withInput(token)
            }
        })

        if (lastEvalKey[hkKey] == null || lastEvalKey[rkKey] == null || lastEvalKey[hkKey].S !== hkValue) {
            throw new ValidateError().withMessage('Invalid pagination token')
        }

        return lastEvalKey
    }
}
