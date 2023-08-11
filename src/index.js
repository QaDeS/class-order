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
    console.log(classProps)
}

// TODO allow for arrays for twMerge compatability
// and so user can mix and match between merge and forceMerge
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
    // TODO find better name?
    return mergeInternal(str, true)
}

/**
 * 
 * @returns {any} the generated class
 */
function defineClass () {
    // TODO keep instance around for performance?
    const name = `class_order_${Math.floor(Math.random() * 999999)}` // TODO use hash instead?
    const style = document.createElement('style')
    style.innerHTML = `.${name} {}`
    document.head.appendChild(style)
    return {name, style: style.sheet.cssRules[0].style}
}

/**
 * @param {string} str
 * @param {boolean} override
 * @param {HTMLElement | undefined} el
 * @returns {string}
 */
function mergeInternal (str, override, el = undefined) {
    if (import.meta.env && import.meta.env.DEV) init()
    console.log("\n", str, override)

    let cls = str.split(' ')
        .filter(Boolean) // ignore excessive whitespaces

    const /** @type {string[]} */ result = []
    const /** @type {Record<String, string>} */ definedProps = {}
    const /** @type {string[]} */ importantProps = []
    let /** @type {string} */ c
    while ((c = cls.pop())) {
        const props = classProps[c]
        if (!props) {
            console.error("Unknown class", c)
            continue
        }
        console.debug("class", c, props)

        const newProps = props.properties.filter((p) => !definedProps[p])
        const overriding = props.importantProperties.filter((p) => !importantProps.includes(p))

        const registerClass = () => {
            result.unshift(c)
            newProps.forEach((p) => definedProps[p] = c)
            importantProps.push(...overriding)
        }

        if (newProps.length == props.properties.length) {
            // no conflicts
            console.debug("00", newProps, props)
            registerClass()
        } else if (override) {
            if (props.importantProperties.length > newProps.length) {
                console.debug("01")
 
                if (newProps.length) {
                    console.debug("02")

                    const overridden = [...new Set(props.importantProperties.map((p) => definedProps[p]).filter(Boolean))]

                    let e = el
                    if (!el) {
                        console.warn("No Element, estimating style for", c)
                        e = document.createElement('div') // TODO keep instance around for performance
                        document.body.appendChild(e)
                    }

                    e.className = result.join(' ')
                    const s = getComputedStyle(e)

                    const {name, style} = defineClass()
                    props.importantProperties.filter((p) => definedProps[p])
                        .forEach((p) => style.setProperty(p, s.getPropertyValue(p), 'important'))

                    if(!el) document.body.removeChild(e)

                    // FIXME
                    // overridden.forEach((o) => result.splice(result.indexOf(o)))

                    registerClass()
                    result.push(name)

                    console.warn("Overriding", c, "with", name)
                } else {
                    console.debug("03")
                    const overridden = [...new Set(props.properties.map((p) => definedProps[p]))]
                    console.warn("Override", c, ...overridden)
                }

            }
        } else {
            if(props.importantProperties.length && !overriding.length) {
                // all overridden -> delete
                console.debug("11")
            } else if (props.importantProperties.length == props.properties.length - newProps.length) {
                // only important new properties
                console.debug("12")
                registerClass()
            } else if(props.importantProperties.length > overriding.length) {
                // TODO check if possible precedence conflict (did I take order into account properly?)
                console.debug("13")
                registerClass()
            } else if(!props.properties.filter((p) => !importantProps.includes(p)).length ) {
                // FIXME for twMerge compat: leave in unnecessarily
                console.debug("14")
                registerClass()
            } else if(props.properties.filter((p) => !definedProps[p]).length ) {
                console.debug("15")
                registerClass()
            } else {
                console.info("Deleting", c)
            }
        }
    }

    console.log(result.join(' '))
    return result.join(' ')
}

/**
 * 
 * @param {AugmentedElement} el 
 * @returns 
 */
function classOrder (el, opts = { override: false }) {
    // TODO allow using twMerge directly
    const { override } = opts
    el.className = mergeInternal(el.className, override, el)
    el._setAttribute = el.setAttribute
    el.setAttribute = (k, v) => {
        if (k != 'class') return el._setAttribute(k, v)
        el._setAttribute(k, mergeInternal(v, override, el))
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
function forceClassOrder (el) {
    return classOrder(el, { override: true })
}

export {
    merge,
    forceMerge,
    classOrder,
    forceClassOrder,
}