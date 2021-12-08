export interface TSDocOptions {
    desc?: string
    deprecated?: boolean | string
    validValues?: string[]
    errors?: Array<{
        code: string
        type: string
        msg: string
        see?: string
    }>
    throws?: Array<{
        code: string
        type: string
        msg: string
        link?: string
    }>
}

export class TSDoc {
    private str: string[] = []

    constructor(options?: TSDocOptions) {
        if (options) {
            this.build(options)
        }
    }

    private static hasDoc(options: TSDocOptions): boolean {
        let hd = !!options.desc
        hd = !!(hd || options.errors)
        hd = !!(hd || options.deprecated)
        hd = !!(hd || options.throws)
        hd = !!(hd || (options.validValues && options.validValues.length))

        return hd
    }

    build(options: TSDocOptions): void {
        this.str.length = 0

        let hasDesc = false
        const hasReq = false
        const hasLogic = false
        let hasvalidValue = false
        let hasError = false
        let hasThrow = false
        if (!TSDoc.hasDoc(options)) {
            return
        }

        this.start()
        if (options.desc) {
            hasDesc = true
            this.wrapText(options.desc)
        }

        if (options.validValues) {
            if (hasDesc || hasReq || hasLogic) {
                this.newline()
            }

            hasvalidValue = true
            this.text('values:', options.validValues.join(', '))
        }

        if (options.errors && options.errors.length > 0) {
            if (hasDesc || hasReq || hasLogic || hasvalidValue) {
                this.newline()
            }
            hasError = true
            for (const error of options.errors) {
                if (error.see) {
                    this.text('@errors', `{@see ${error.see}}`, `"${error.type}"`, `"${error.msg}"`)
                } else {
                    this.text('@errors', `${error.code}`, `"${error.type}"`, `"${error.msg}"`)
                }
            }
        }

        if (options.throws && options.throws.length > 0) {
            if (hasDesc || hasReq || hasLogic || hasError || hasvalidValue) {
                this.newline()
            }
            hasThrow = true
            for (const error of options.throws) {
                if (error.link) {
                    this.text(
                        '@throws',
                        `{${error.link}}`,
                        error.type ? `"${error.type}"` : '',
                        error.msg ? `"${error.msg}"` : '',
                    )
                } else {
                    this.text(
                        '@throws',
                        `${error.code}`,
                        error.type ? `"${error.type}"` : '',
                        error.msg ? `"${error.msg}"` : '',
                    )
                }
            }
        }

        if (options.deprecated) {
            if (hasDesc || hasReq || hasLogic || hasError || hasThrow || hasvalidValue) {
                this.newline()
            }
            if (options.deprecated) {
                if (typeof options.deprecated === 'string') {
                    this.text('@deprecated', options.deprecated)
                } else {
                    this.text('@deprecated')
                }
            }
        }

        this.end()
    }

    toString(indent = 0): string {
        if (this.str.length === 0) {
            return ''
        }

        return this.str
            .map(s => {
                return s !== '\n' ? ' '.repeat(indent) + s : '\n'
            })
            .join('')
    }

    toDartString(indent = 0): string {
        if (this.str.length === 0) {
            return ''
        }

        const strList = this.str.slice(1, this.str.length - 2)

        return strList
            .map(s => {
                return s !== '\n' ? ' '.repeat(indent) + s.replace(' *', '///') : '\n'
            })
            .join('')
    }

    private start(): void {
        this.str.push('/**\n')
    }

    private end(): void {
        this.str.push(' */\n')
    }

    private newline(): void {
        this.str.push(' *\n')
    }

    private text(...texts: string[]): void {
        const strs = texts.filter(t => {
            return t
        })
        if (strs.length === 0) {
            return
        }

        this.str.push(` * ${strs.join(' ')}`)
        this.str.push('\n')
    }

    private wrapText(
        str: string,
        options: {width: number} = {
            width: 80,
        },
    ): void {
        if (!str) {
            return
        }

        const width = options.width

        const regexString = '.{1,' + width.toString() + '}'
        const re = new RegExp(regexString, 'g')
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        const lines: string[] = str.match(re) || []

        let result = lines
            .map(line => {
                line = line.trim()
                if (line && line.endsWith('\n')) {
                    line = line.slice(0, line.length - 1)
                }

                return line
            })
            .join('!@##@!')

        result = result.replace(/[ \t]*$/gm, '')

        result.split('!@##@!').forEach(s => this.text(s))
    }
}
