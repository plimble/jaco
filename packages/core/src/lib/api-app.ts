import {App} from './app'
import {ApiGatewayEventParser} from './event-parsers/api-gateway-event-parser'
import {ApiRouter} from './handlers/router/router'
import {RouterHandler} from './handlers/router/router-handler'

export function createApiApp(router: ApiRouter): App {
    return new App({
        eventParser: ApiGatewayEventParser,
        handler: new RouterHandler(router),
    })
}
