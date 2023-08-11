import { describe, it, expect } from 'bun:test'
import puppeteer, { Browser, Page } from 'puppeteer';

let browser : Browser
async function createPage(style : string, body = '') {
    if( browser === undefined ) browser = await puppeteer.launch({headless: "new"})
    const page = await browser.newPage()
    await page.setContent(`
    <html>
        <head>
            <style type="text/css">${style}</style>
        </head>
        <body>
            ${body}<h1>Hello</h1>
        </body>
    `, {timeout: 3000, waitUntil: 'load'})
    return page
}

async function run<T>(page : Page, fn : () => T) {
    console.log(fn.toString())
    return page.evaluate(`(${fn.toString()})()`)
}

// skipping because happydom seems to work for now
describe.skip("Basics", () => {
    it('proceses overwritten attributes', async () => {
        const page = await createPage(`.overridden {background-color: blue !important;}, .override {background-color: red;}`);
        const bg = await run(page, () => {
            //return navigator.appVersion
            //return document.head.innerHTML
            return document.styleSheets[0].cssRules[0].style.getPropertyPriority('background-color')//toString()//getPriority()
        })
        console.log(bg)
        expect(!!document.body).toBe(true)
    })

    it('proceses underwritten attributes', async () => {
        const page = await createPage(`.overridden {background-color: blue !important;}, .override {background-color: red;}`);
        const bg = await run(page, () => {
            //return navigator.appVersion
            //return document.head.innerHTML
            return document.styleSheets[0].cssRules[0].style.getPropertyPriority('background-color')//toString()//getPriority()
        })
        console.log(bg)
        expect(!!document.body).toBe(true)
    })
})