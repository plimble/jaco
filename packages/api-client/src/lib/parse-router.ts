import {validationMetadatasToSchemas} from 'class-validator-jsonschema'
import * as glob from 'glob'
import {SchemaObject} from 'openapi3-ts'
import {Controller, controllerPaths, getMetadataApi} from '@onedaycat/jaco'
import {Constructor} from '@onedaycat/jaco-common'
import {defaultMetadataStorage} from 'class-transformer/cjs/storage'

export interface ApiSchema {
    method: string
    path: string
    ctrl: Constructor<Controller>
    desc?: string
    inputClass?: string
    outputClass?: string
}

export interface ParseSchemasResult {
    apiSchemas: ApiSchema[]
    jsonSchemas: Record<string, SchemaObject>
}

export async function parseRouter(globPath: string): Promise<ParseSchemasResult> {
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
                    inputClass: apiInfo.input?.name,
                    outputClass: apiInfo.output?.name,
                })
            }
        }
    }

    const jsonSchemas = validationMetadatasToSchemas({
        classTransformerMetadataStorage: defaultMetadataStorage,
    })

    return {
        apiSchemas: Array.from(apiSchemas.values()),
        jsonSchemas: jsonSchemas,
    }
}
