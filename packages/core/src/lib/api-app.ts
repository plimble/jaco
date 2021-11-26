import {ApiGatewayEventParser} from 'packages/core/src/lib/event-parsers/api-gateway-event-parser'
import {App} from './app'
import {Router} from './handlers/router/router'
import {RouterHandler} from './handlers/router/router-handler'

export function createApiApp(router: Router): App {
    return new App({
        eventParser: ApiGatewayEventParser,
        handler: new RouterHandler(router),
    })
}
