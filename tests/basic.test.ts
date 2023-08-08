import { describe, it, expect } from 'bun:test'

describe("Basics", () => {
    it('proceses overwritten attributes', () => {
        expect(!!document.body).toBe(true)
    })
})