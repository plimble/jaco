import {ApiSchema} from '../../parse-router'
import {constantCase} from 'change-case'

function genErrors(apiSchemas: ApiSchema[]): string {
    const tpl: string[] = []

    apiSchemas.forEach(apiSchema => {
        if (apiSchema.errors && apiSchema.errors.length) {
            apiSchema.errors.forEach(err => {
                const errCode = err()[1]
                tpl.push(`    ${constantCase(errCode)}: '${errCode}',`)
            })
        }
    })

    return tpl.join('\n')
}

export function errorsTpl(apiSchemas: ApiSchema[]): string {
    return `export const API_ERROR = {
${genErrors(apiSchemas)}
};
`
}
