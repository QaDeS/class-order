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
 * @typedef Properties
 * @property {string[]} properties
 * @property {string[]} importantProperties
 * 
 * @typedef {Record<string, Properties>} ClassProps
 * 
 * @typedef ClassOrderOptions
 * @property {boolean?} override
 */

/**
 * Debug output, ignore by default and use console.debug if in DEV mode
 */
let dbg = (/** @type {any} */...args) => { }
import('process').then((m) => { if ((import.meta.env && import.meta.env.DEV) || (m.env && m.env.DEV)) dbg = (...args) => console.debug(...args) })

let /** @type ClassProps} */ classProps = {}

/**
 * Unescapes a (tailwind) class name.
 * @param {string} cls 
 * @returns {string} the unescaped class name
 */
function unescapeClass (cls) {
    return [..."![]#/"].reduce((result, c) => result.replace(`\\${c}`, c), cls)
}

/**
 * Creates a function that scopes property names
 * @param {string[]} scopes 
 * @returns 
 */
function scopedNameFn (scopes) {
    /**
     * Scopes the given property names
     * @param {string[]} propertyNames
     * @returns 
     */
    return function scopedName (propertyNames) {
        return propertyNames.map((p) => [...scopes.sort(), p].join('.'))
    }
}

// TODO take care of linting errors
if (globalThis.document) init() // TODO make available in ssr
export function init () {
    const /** @type ClassProps} */ newClassProps = {}

    const rules = Array.from(document.styleSheets).map((ss) => Array.from(ss.cssRules)).flat()
    for (const r of rules) {
        const props = Array.from(r.style ?? [])
            .filter((p) => !p.startsWith('--')) // exclude variables
            .sort()

        /** @type string[][] */
        const selectors = (r.selectorText ?? '')
            .split(',') // split multiple selectors
            .map((/** @type {string} */ s) => s.split('\\:')) // take care of tailwind conditions
            .filter((/** @type {string[]} */ s) => s.filter((scomp) => scomp.startsWith('.')).length) // TODO allow elem.cls selectors

        for (const selector of selectors) {
            const classSelectors = selector.map((scomp) =>
                scomp.slice(scomp.startsWith('.') ? 1 : 0)  // cut class indicator
                    .split(':'))                            // take care of pseudo classes

            /** @type string[] */
            let scopes = []
            const cls = classSelectors.map((c) => {
                const className = c.shift()
                scopes.push(...c)           // all pseudo classes get turned into scopes
                // TODO also handle scoped styles in the form of .cls.scopeHash
                return className
            }).join(':')

            const scopedNames = scopedNameFn(scopes)
            const properties = scopedNames(props) // store scoped property names
            const importantProperties = scopedNames(props.filter((p) => r.style.getPropertyPriority(p) === 'important'))

            const unescaped = unescapeClass(cls)
            newClassProps[unescaped] = { properties, importantProperties }
        }
    }

    classProps = newClassProps
    dbg(classProps)
}

// and so user can mix and match between merge and forceMerge
/**
 * @param {string[]} str 
 * @returns {string}
 */
function merge (...str) {
    return mergeInternal(str, false)
}

/**
 * @param {string[]} str
 * @returns {string}
 */
function forceMerge (...str) {
    // TODO find better name?
    return mergeInternal(str, true)
}

let newId = 0
/**
 * 
 * @returns {any} the generated class
 */
function defineClass () {
    // TODO keep instance around for performance?
    const name = `class_order_${newId++}`
    const style = document.createElement('style')
    style.innerHTML = `.${name} {}`
    document.head.appendChild(style)
    return { name, style: style.sheet.cssRules[0].style }
}

function addClass (el, c, result, props, definedProps) {
    let e = el
    if (!el) {
        console.warn("No Element, estimating style for", c)
        e = document.createElement('div') // TODO keep instance around for performance
        document.body.appendChild(e)
    }

    e.className = result.join(' ')
    const s = getComputedStyle(e)

    const { name, style } = defineClass()
    props.filter((p) => definedProps[p])
        .forEach((p) => style.setProperty(p, s.getPropertyValue(p), 'important'))

    if (!el) document.body.removeChild(e)

    // FIXME
    // overridden.forEach((o) => result.splice(result.indexOf(o)))
    result.push(name)
    return name
}

/**
 * @param {string[]} str
 * @param {boolean} override
 * @param {HTMLElement | undefined} el
 * @returns {string}
 */
function mergeInternal (str, override, el = undefined) {
    if (import.meta.env && import.meta.env.DEV) init()
    dbg("\n", str, override)

    let cls = str.join(' ').split(' ')
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
        dbg("class", c, props)

        const newProps = props.properties.filter((p) => !definedProps[p])
        const overriding = props.importantProperties.filter((p) => !importantProps.includes(p))

        const registerClass = () => {
            result.unshift(c)
            newProps.forEach((p) => definedProps[p] = c)
            importantProps.push(...overriding)
        }

        if (newProps.length == props.properties.length) {
            // no conflicts
            dbg("00", newProps, props)
            registerClass()
        } else if (override) {
            if (props.importantProperties.length > newProps.length) {
                dbg("01")

                if (newProps.length) {
                    dbg("02")

                    const overridden = [...new Set(props.importantProperties.map((p) => definedProps[p]).filter(Boolean))]

                    const name = addClass(el, c, result, props.importantProperties, definedProps)

                    registerClass()

                    console.warn("Overriding", c, "with", name)
                } else {
                    dbg("03")
                    const overridden = [...new Set(props.properties.map((p) => definedProps[p]))]
                    console.warn("Overriding", ...overridden, "with", c)
                }
            } else {
                dbg("04")
                if (newProps.length) {
                    dbg("05")
                    if(props.importantProperties.length) {
                        dbg("06")
                        const name = addClass(el, c, result, props.importantProperties, definedProps)
                    } else {
                        dbg("07", props)
                    }
                    registerClass()
                }
            }
        } else {
            if (props.importantProperties.length && !overriding.length) {
                // all overridden -> delete
                dbg("11")
            } else if (props.importantProperties.length == props.properties.length - newProps.length) {
                // only important new properties
                dbg("12")
                registerClass()
            } else if (props.importantProperties.length > overriding.length) {
                // TODO check if possible precedence conflict (did I take order into account properly?)
                dbg("13")
                registerClass()
            } /*else if(!props.properties.filter((p) => !importantProps.includes(p)).length ) {
                // FIXME for twMerge compat: leave in unnecessarily
                dbg("14")
                registerClass()
            } */else if (props.properties.filter((p) => !definedProps[p]).length) {
                dbg("15")
                registerClass()
            } else {
                dbg("Deleting", c)
            }
        }
    }

    return result.join(' ')
}

/**
 * A directive that implements better precedence in the `class` attribute.
 * 
 * @param {HTMLElement} el
 * @param {ClassOrderOptions} opts
 */
function classOrderInternal (el, opts = { override: false }) {
    // TODO allow applying this to the complete (watched) DOM?
    const { override } = opts
    const setAttribute = el.setAttribute.bind(el)
    el.setAttribute = (k, v) => {
        const val = (k == 'class') ? mergeInternal(v.split(','), !!override, el) : v
        return setAttribute(k, val)
    }
    el.setAttribute('class', el.className)

    return {
        destroy () {
            el.setAttribute = setAttribute
        }
    }
}

/**
 * A directive that implements strict precedence in the `class` attribute.
 * 
 * @param {HTMLElement} el
 */
function forceClassOrder (el) {
    return classOrderInternal(el, { override: true })
}

/**
 * A directive that implements lax precedence in the `class` attribute.
 * 
 * @param {HTMLElement} el
 */
function classOrder (el) {
    return classOrderInternal(el, { override: false })
}

export {
    merge,
    forceMerge,
    classOrder,
    forceClassOrder,
}
