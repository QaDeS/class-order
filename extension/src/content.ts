/// <reference lib="dom" />
const dbg = () => {} //console.debug

const DATA_ID = "__coId"

type ConditionFn = () => boolean
type ConditionalStyle = Record<string, boolean | ConditionFn>
type ClassName = string | ConditionalStyle | SVGAnimatedString
type ClassNames = ClassName | Array<ClassName>

function createStyle (id : string) : HTMLStyleElement {
    const style = document.createElement('style')
    style.id = id
    document.head.appendChild(style)
    return style
}

export function importCss (src : string, id : string) {
    const existing = document.head.querySelector(`style[@id="${id}"]`)
    const style = existing ? existing : createStyle(id)
    style.innerHTML = src
}


function unescapeClass (cls : string) : string {
    return [..."![]#/"].reduce((result, c) => result.replace(`\\${c}`, c), cls)
}

function scopedNameFn (scopes : Array<string>) {
    return function scopedName (propertyNames : Array<string>) {
        return propertyNames.map((p) => [...scopes.sort(), p].join('.'))
    }
}

function styleRule(rule : CSSRule)  : CSSStyleRule | undefined{
    // @ts-ignore
    if( rule.type === CSSRule.STYLE_RULE ) return rule
}

function updateClassProps() {
    dbg("INIT")

    const /** @type ClassProps} */ newClassProps = {}

    const rules = Array.from(document.styleSheets).map((ss) => Array.from(ss.cssRules)).flat()
    for (const rule of rules) {
        const r = styleRule(rule)
        if( !r ) continue

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

    return newClassProps
}

let classesUpdated = true
let classProps : Record<string, any> = {}
function getClassProps(selector : string) {
    if( classesUpdated ) {
        classProps = updateClassProps()
        classesUpdated = false // TODO install hooks to automatically set to true
    }
    return classProps[selector]
}

let newId = 0
function defineClass(tags : Array<string>, overridden : string) : {name: string, rule: CSSRule} {
    // TODO keep instance around for performance?
    const name = `co_${overridden}_${newId++}`
    const style = document.createElement('style')
    style.innerHTML = `.${[name, ...tags].join('.')} {}`
    document.head.appendChild(style)
    console.warn("Overriding", overridden, "with", name)
    return { name, rule: style.sheet!.cssRules[0] }
}

function mergeInternal(str: Array<string>, el: HTMLElement | SVGElement | undefined = undefined) {
    let cls = [...str].filter(Boolean) // ignore excessive whitespaces

    const result: Array<string> = []
    const definedProps: Record<string, string> = {}
    const importantProps: Array<string> = []
    let c: string
    let tags: Array<string> = []

    function addClass(c: string, props: Array<string>) {
        let e = el
        if (!el) {
            console.warn("No Element, estimating style for", c)
            e = document.createElement('div') // TODO keep instance around for performance
            document.body.appendChild(e)
        }

        e.classList.value = result.join(' ')
        const s = getComputedStyle(e)

        const { name, rule } = defineClass(tags, c)
        props.filter((p) => definedProps[p])
            .forEach((p) => rule.style.setProperty(p, s.getPropertyValue(p), 'important'))

        if (!el) document.body.removeChild(e)

        addStyle(rule.outerHTML)

        // FIXME
        // overridden.forEach((o) => result.splice(result.indexOf(o)))
        result.push(name)
        return name
    }

    while ((c = cls.pop())) {
        let props = undefined

        // TODO find better solution
        const path = [c, ...tags, ...tags] // seems like tags are applied twice under some circumstances
        while (!(props = getClassProps(path.join('.')))) {
            if (!path.pop()) break
        }
        const [_, ...usedTags] = path

        if (!props || !props.properties.length) {
            dbg("Tag class", c)
            tags.push(c)
            result.unshift(c)
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
        } else {
            if (props.importantProperties.length > newProps.length) {
                dbg("01")

                if (newProps.length) {
                    dbg("02")

                    const name = addClass(c, props.importantProperties)

                    registerClass()
                } else {
                    dbg("03")
                    const overridden = [...new Set(props.properties.map((p) => definedProps[p]))]
                    console.warn("Overriding", ...overridden, "with", c)
                }
            } else {
                dbg("04")
                if (newProps.length) {
                    dbg("05")
                    if (props.importantProperties.length) {
                        dbg("06")
                        const name = addClass(c, props.importantProperties)
                    } else {
                        dbg("07", props)
                    }
                    registerClass()
                }
            }
        }
    }

    return result
}

function disectClass(cls: ClassNames, ordered: Array<string> = []) {
    const values: Array<string> = []

    function apply(c: ClassNames) {
        const r = disectClass(c, ordered);
        ordered.push(...r.ordered.filter((o) => !ordered.includes(o)));
        values.push(...r.values)
    }

    if (Array.isArray(cls)) {
        cls.forEach(apply)
    } else if ((cls as SVGAnimatedString).baseVal) {
        console.log("\n", (cls as SVGAnimatedString).baseVal, "\n", (cls as SVGAnimatedString).animVal)
        apply((cls as SVGAnimatedString).animVal)
    } else if (typeof cls === 'string') {
        cls.split(/\s+/).forEach((c) => {
            if (!ordered.includes(c)) ordered.push(c)
            values.push(c)
        })
    } else {
        // we got an object
        const o = cls as ConditionalStyle
        Object.entries(o).forEach(([k, v]) => {
            const val = (typeof v === 'function') ? v() : v
            if (!ordered.includes(k)) ordered.push(k)
            if (v) values.push(k)
        })
    }

    return {
        ordered,
        values: ordered.filter((o) => values.includes(o))
    }
}

//const elOrder: Record<string, string[]> = {}
//let lastId = 0
function getOrdered(el: HTMLElement | SVGElement) {
    // TODO store in classList
    /*
    const coId = el.dataset[DATA_ID]
    if (coId) return elOrder[coId]

    const newId = (lastId++).toString()
    el.dataset[DATA_ID] = newId
    const result: string[] = []
    elOrder[newId] = result
    */
   if( el.classList.order ) return el.classList.order
   const result = []
   el.classList.order = result
    return result
}

let inMerge = false
function _mergeInternal(str: ClassNames, el: HTMLElement | SVGElement) {
    if( inMerge ) return
    inMerge = true
    let cls = disectClass(str, getOrdered(el));
    el.classList.order = cls.ordered
    const merged = mergeInternal(cls.values, el)
    inMerge = false
    return merged.join(' ');
}



function forEachElement(fn: (node: HTMLElement) => void) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    node.classList && fn(node as HTMLElement);
                })
            }
        });
    });

    for (const el of Array.from(document.querySelectorAll('*'))) {
        fn(el as HTMLElement);
    }
    observer.observe(document.body, { childList: true, subtree: true });
}


const destructors: Array<{ destroy: Function }> = []

const augmentFns = (el: HTMLElement | SVGElement) => {
    const classList = el.classList
    classList.rawValue = classList.value

    function updateAfter(result : any) {
        classList.rawValue = classList.value
        el.setAttribute('class', classList.value)
        return result
    }


    function toggle(value: string, token: string, force?: boolean) {
        const values = value.split(' ')
        if(values.includes(token) && force !== true) {
            return values.filter((t) => t !== token)
        } else if(!values.includes(token) && force !== false) {
            return [...values, token]
        } else {
            return values
        }
    }

    const proxy : DOMTokenList = {
        add(...tokens: Array<string>) {
            return updateAfter(classList.value = [classList.rawValue, ...tokens].join(' '));
        },
        remove(...tokens: Array<string>) {
            return updateAfter(classList.value = classList.rawValue.split(' ').filter((t) => !tokens.includes(t)).join(' '));
        },
        replace(token: string, newToken: string) {
            return updateAfter(classList.value = classList.rawValue.split(' ').map((t) => (t === token) ? newToken : t).join(' '));
        },
        toggle(token: string, force?: boolean) {
            return updateAfter(classList.value = toggle(classList.rawValue, token, force).join(' '))
        },
        contains(token) {
            return classList.contains(token)
        },
        forEach(callbackfn, thisArg) {
            return classList.forEach(callbackfn, thisArg)
        },
        item(index) {
            return classList.item(index)
        },
        supports(token) {
            return classList.supports(token)
        },
        toString() {
            return classList.toString()
        },
    }
    
    return [proxy, updateAfter]
}

function augmentClassList(el: HTMLElement) {
    const classList = el.classList
    const [augmented, updateAfter] = augmentFns(el)

    const proxy = new Proxy<typeof classList>(classList, {
        get(target, p, receiver) {
            return augmented[p] || classList[p];
        },
        set(target, p, newValue, receiver) {
            return updateAfter(classList[p] = newValue);
        },
    })

    let active = true
    Object.defineProperty(el, 'classList', {
        get(): DOMTokenList {
            return active ? proxy : classList;
        }
    })

    destructors.push({
        destroy() {
            active = false
        }
    })
}

function initElement(el: HTMLElement) {
    if( el.dataset[DATA_ID] ) return;
    el.setAttribute('class', el.classList.value)
    augmentClassList(el);
}

function hookElement(prototype: HTMLElement | SVGElement) {
    const setAttribute = prototype.setAttribute
    prototype.setAttribute = function (k, v) {
        if (k !== 'class' || !v) return setAttribute.call(this, k, v)
        const val = _mergeInternal(v, this)
        setAttribute.call(this, k, val);
    }
    return () => prototype.setAttribute = setAttribute
}

function hookPrototype() {
    const htmlDestroy = hookElement(HTMLElement.prototype)
    const svgDestroy = hookElement(SVGElement.prototype)

    forEachElement(initElement)

    return () => {
        destructors.forEach((d) => d?.destroy())
        htmlDestroy()
        svgDestroy()
    }
}

globalThis.unhook = hookPrototype()
console.log("LOADED ClassOrder!")
