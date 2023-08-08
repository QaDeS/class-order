type OldStyle = Array<string> & Record<string, string>
type OldRule = {
    selectorText: string
    style: OldStyle
}
type OldStyleSheet = {
    rules: OldRule[]
}
type OldStyleSheets = Array<OldStyleSheet>

type AugmentedElement = HTMLElement & {
    _setAttribute?(k: string, v: any): void
}

type ClassProps = Record<string, string[]>
let classProps: ClassProps = {}

if( globalThis.document ) init() // TODO make available in ssr
function init() {
    const oldStyleSheets = document.styleSheets as any as OldStyleSheets

    const newClassProps : ClassProps = {}
    Array.from(oldStyleSheets).forEach((ss) => {
        Array.from(ss.rules).forEach((r) => {
            const props = Array.from(r.style ?? []).filter((k) => !k.startsWith('--')).sort()
            const selectors = (r.selectorText ?? '').split(',').map((s) => s.split('\\:')).filter((s) => s.filter((sc) => sc.startsWith('.')).length) // TODO allow elem.cls selectors
            selectors.forEach((selector) => {
                const clss = selector.map((sc) => sc.slice(sc.startsWith('.') ? 1 : 0).split(':'))
                console.log("clss", clss)
                let scopes : string[] = []
                const cls = clss.map((c) => {
                    const className = c.shift()
                    scopes.push(...c)   // all pseudo classes get turned into scopes
                    // TODO also handle scoped styles in the form of .cls.scopeHash
                    return className
                }).join(':')
                const unescaped = cls.replace('\\[', '[').replace('\\]', ']').replace('\\#', '#')
                const properties = props.map((p) => [...scopes.sort(), p].join('.'))
                console.log(unescaped, scopes, properties)
                newClassProps[unescaped] = properties
            })
        })
    })

    classProps = newClassProps
    console.log(classProps)
}

export function merge(str: string) {
    if( import.meta.env.DEV ) init()

    let cls = str.split(' ')
        .filter(Boolean) // ignore excessive whitespaces
    
    const result = []
    const definedProps : string[] = []
    let c: string
    while ((c = cls.pop()!)) {
        const props = classProps[c]
        if( !props ) {
            console.error("Unknown class", c)
            continue
        }

        const newProps = props.filter((p) => !definedProps.includes(p))
        if( !newProps.length ) continue

        result.unshift(c)
        definedProps.push(...newProps)
    }
    return result.join(' ')
}

export function classOrder(el: AugmentedElement) {
    el.className = merge(el.className)
    el._setAttribute = el.setAttribute
    el.setAttribute = (k, v) => {
        if (k != 'class') return el._setAttribute!(k, v)
        el._setAttribute!(k, merge(v))
    }
    return {
        destroy() {
            el.setAttribute = el._setAttribute!
            delete el._setAttribute
        }
    }
}
