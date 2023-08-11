import {twMerge} from 'tailwind-merge'

/**
 * A directive that uses tailwind-merge to implement better precedence in the `class` attribute.
 * 
 * @param {HTMLElement} el 
 */
export function classOrder (el) {
    const setAttribute = el.setAttribute.bind(el)
    el.setAttribute = (k, v) => {
        const val = (k == 'class') ? twMerge(v.split(',')) : v
        return setAttribute(k, val)
    }
    el.setAttribute('class', el.className)

    return {
        destroy () {
            el.setAttribute = setAttribute
        }
    }
}

