import {SNSParser} from './sns-parser'
import {RawParser} from './raw-parser'
import {KinesisParser} from './kinesis-parser'
import {SQSParser} from './sqs-parser'
import {ApiGatewayParser} from './api-gateway-parser'
import {AppError} from '@plimble/jaco-common'

export interface EventParser {
    onParseRequestError(err: AppError): any
    parseErrorResponse(err: AppError): any
    parseRequest(event: any): any
    parseResponse(payload: any): any
}

export interface EventResolverInfo {
    resolve: (event: any) => EventParser | undefined
}

export class EventResolver {
    private _resolvers: EventResolverInfo[] = [ApiGatewayParser, SNSParser, KinesisParser, SQSParser]

    add(resolver: EventResolverInfo) {
        this._resolvers.push(resolver)
    }

    remove(resolver: EventResolverInfo) {
        this._resolvers = this._resolvers.filter(r => r !== resolver)
    }

    resolve(event: any): EventParser {
        for (const resolver of this._resolvers) {
            const parser = resolver.resolve(event)
            if (parser) {
                return parser
            }
        }

        return RawParser
    }
}
