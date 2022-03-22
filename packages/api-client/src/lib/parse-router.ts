import * as glob from 'glob'
import {Controller, controllerPaths, getMetadataApi} from '@onedaycat/jaco'
import {AppErrorSchema, Constructor} from '@onedaycat/jaco-common'
import {getSchema} from '@onedaycat/jaco-validator'

export interface ApiSchema {
    method: string
    path: string
    ctrl: Constructor<Controller>
    desc?: string
    errors?: AppErrorSchema[]
    inputSchema?: Record<string, any>
    outputSchema?: Record<string, any>
}

export async function parseRouter(globPath: string): Promise<ApiSchema[]> {
    const apiSchemas = new Map<string, ApiSchema>()
    const paths = glob.sync(globPath)
    for (const path of paths) {
        await import(path)
        const fns = controllerPaths()
        for (const [methodPath, fn] of Object.entries(fns)) {
            const ctrl = await fn()
            const [method, path] = methodPath.split(' ')
            const apiInfo = getMetadataApi(ctrl)
            if (apiInfo) {
                apiSchemas.set(methodPath, {
                    ctrl: ctrl,
                    method: method,
                    path: path,
                    desc: apiInfo.description,
                    inputSchema: apiInfo.input ? getSchema(apiInfo.input) : undefined,
                    outputSchema: apiInfo.output ? getSchema(apiInfo.output) : undefined,
                    errors: apiInfo.errors,
                })
            }
        }
    }

    return Array.from(apiSchemas.values())
}
