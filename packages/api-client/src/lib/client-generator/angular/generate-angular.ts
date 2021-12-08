import {ApiSchema} from '../../parse-router'
import {errorsTpl} from './errors-tpl'
import {loadTplTxt} from '../../helper/load-tpl-txt'
import path from 'path'

export interface AngularTemplate {
    errors: string
    utils: string
    apiConfig: string
    index: string
}

export function generateAngular(apiSchemas: ApiSchema[]): AngularTemplate {
    return {
        errors: errorsTpl(apiSchemas),
        utils: loadTplTxt(path.join(__dirname, 'utils-tpl.txt')),
        apiConfig: loadTplTxt(path.join(__dirname, 'api-config-tpl.txt')),
        index: loadTplTxt(path.join(__dirname, 'index-tpl.txt')),
    }
}
