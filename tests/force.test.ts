import { describe, it, expect } from 'bun:test'
import '../happydom'
import { init, forceMerge } from '../src/index.js'

async function setupPage(style : string, body = '') {
    const p = new Promise((res) => setTimeout(res, 100, "ok"))
    document.head.innerHTML = `<style>${style}</style>`
    if( body ) document.body.innerHTML = body
    await p
}

async function setup() {
    await setupPage(`
        .bg-blue {background-color: blue;}
        .\\!bg-blue {background-color: blue !important;}
        
        .bg-red {background-color: red;}
        .\\!bg-red {background-color: red !important;}
        

        .px-1 {padding-left: 1px; padding-right: 1px;}
        .\\!px-1 {padding-left: 1px !important; padding-right: 1px !important;}

        .p-1 {padding: 1px; }
        .\\!p-1 {padding: 1px !important;}

        .a.tag {background-color: blue !important; margin: 1px;}
        .b.tag {background-color: red;}
        .c {background-color: greem;}
    `);
    await init()
}

function testEqual(cls : string, expected : string = cls) {
    expect(forceMerge(cls)).toEqual(expected)
}

describe("forceMerge", () => {

    it('removes first mention of same property', async () => {
        await setup()

        testEqual("bg-blue bg-red", "bg-red")
        testEqual("bg-red bg-blue", "bg-blue")

        testEqual("!bg-blue bg-red", "bg-red")
        testEqual("!bg-red bg-blue", "bg-blue")

        testEqual("bg-blue !bg-red", "!bg-red")
        testEqual("bg-red !bg-blue", "!bg-blue")

        testEqual("!bg-blue !bg-red", "!bg-red")
        testEqual("!bg-red !bg-blue", "!bg-blue")
    })

    it('handles classes overriding a subset of properties', async () => {
        await setup()

        testEqual("p-1 px-1")
        testEqual("px-1 p-1", "p-1")

        testEqual("!p-1 px-1", "!p-1 px-1 class_order_0")
        testEqual("!px-1 p-1", "p-1")

        testEqual("p-1 !px-1")
        testEqual("px-1 !p-1", "!p-1")

        testEqual("!p-1 !px-1", "!p-1 !px-1 class_order_1")
        testEqual("!px-1 !p-1", "!p-1")
    })

    it('handles scoped classes', async () => {
        await setup()

        testEqual("a b tag", "a b tag class_order_2")
        testEqual("b a tag", "a tag")

        testEqual("a b c tag", "a b c tag class_order_3") // TODO check
        testEqual("b a c tag", "a c tag")
    })

})