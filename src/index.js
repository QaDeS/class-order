/**
 * @typedef {Array<string> & Record<string, string>} OldStyle
 * 
 * @typedef OldRule
 * @property {string} selectorText
 * @property {OldStyle} style
 * 
 * @typedef OldStyleSheet
 * @property {OldRule[]} cssRules
 * 
 * @typedef {OldStyleSheet[]} OldStyleSheets
 * 
 * @typedef {HTMLElement & ElementAugmentation} AugmentedElement
 * 
 * @typedef ElementAugmentation
 * @property {function} _setAttribute // (k: string, v: any)
 * 
 * @typedef Properties
 * @property {string[]} properties
 * @property {string[]} importantProperties
 * 
 * @typedef {Record<string, Properties>} ClassProps
 */

let /** @type ClassProps} */ classProps = {}

/**
 * 
 * @param {string} cls 
 * @returns 
 */
function unescapeClass (cls) {
    let result = cls
    Array.from("![]#/").forEach((c) => result = result.replace(`\\${c}`, c))
    return result
}

if (globalThis.document) init() // TODO make available in ssr
export function init () {
    const /** @type ClassProps} */ newClassProps = {}

    const styleSheets = document.styleSheets
    Array.from(styleSheets).forEach((ss) => {
        Array.from(ss.cssRules).forEach((r) => {
            const props = Array.from(r.style ?? [])
                .filter((k) => !k.startsWith('--')) // exclude variables
                .sort()
            const /** @type string[][] */ selectors = (r.selectorText ?? '').split(',').map((s) => s.split('\\:')).filter((s) => s.filter((sc) => sc.startsWith('.')).length) // TODO allow elem.cls selectors
            selectors.forEach((selector) => {
                const clss = selector.map((sc) => sc.slice(sc.startsWith('.') ? 1 : 0).split(':'))
                //console.log("clss", clss)

                let /** @type string[] */ scopes = []
                const cls = clss.map((c) => {
                    const className = c.shift()
                    scopes.push(...c)   // all pseudo classes get turned into scopes
                    // TODO also handle scoped styles in the form of .cls.scopeHash
                    return className
                }).join(':')
                const unescaped = unescapeClass(cls)
                const properties = props.map((p) => [...scopes.sort(), p].join('.'))
                const importantProperties = props.filter((p) => r.style.getPropertyPriority(p) === 'important').map((p) => [...scopes.sort(), p].join('.'))

                newClassProps[unescaped] = { properties, importantProperties }
            })
        })
    })

    classProps = newClassProps
}

/**
 * @param {string} str 
 * @returns {string}
 */
function merge (str) {
    return mergeInternal(str, false)
}

/**
 * @param {string} str 
 * @returns {string}
 */
function forceMerge (str) {
    return mergeInternal(str, true)
}

/**
 * @param {string} str
 * @param {boolean} override
 * @returns {string}
 */
function mergeInternal (str, override) {
    if (import.meta.env.DEV) init()

    let cls = str.split(' ')
        .filter(Boolean) // ignore excessive whitespaces

    const result = []
    const /** @type {string[]} */ definedProps = []
    const /** @type {string[]} */ importantProps = []
    let c
    while ((c = cls.pop())) {
        const props = classProps[c]
        if (!props) {
            console.error("Unknown class", c)
            continue
        }

        const newProps = props.properties.filter((p) => !definedProps.includes(p))
        const overriding = props.importantProperties.filter((p) => !importantProps.includes(p))
        if (newProps.length ||
            (!override && (props.importantProperties.length && overriding.length))
        ) {
            result.unshift(c)
            definedProps.push(...newProps)
            importantProps.push(...overriding)
        }
    }

    return result.join(' ')
}

/**
 * 
 * @param {AugmentedElement} el 
 * @returns 
 */
function classOrder (el, opts = {override: false}) {
    const {override} = opts
    el.className = mergeInternal(el.className, override)
    el._setAttribute = el.setAttribute
    el.setAttribute = (k, v) => {
        if (k != 'class') return el._setAttribute(k, v)
        el._setAttribute(k, mergeInternal(v, override))
    }
    return {
        destroy () {
            el.setAttribute = el._setAttribute
            delete el._setAttribute
        }
    }
}

/**
 * 
 * @param {AugmentedElement} el 
 * @returns 
 */
function forceClassOrder(el) {
    return classOrder(el, {override: true})
}

export {
    merge,
    forceMerge,
    classOrder,
    forceClassOrder,
}