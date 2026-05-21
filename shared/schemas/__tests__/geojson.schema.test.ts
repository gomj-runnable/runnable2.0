import { describe, it, expect } from 'vitest'
import { geoJsonPositionSchema } from '#shared/schemas/geojson.schema'

describe('geoJsonPositionSchema', () => {
    it('lng/lat/height 튜플을 파싱한다', () => {
        const result = geoJsonPositionSchema.parse([127.05, 37.5, 10])
        expect(result).toEqual([127.05, 37.5, 10])
    })

    it('요소가 부족하면 실패', () => {
        expect(() => geoJsonPositionSchema.parse([127.05, 37.5])).toThrow()
    })

    it('요소가 초과하면 실패', () => {
        expect(() => geoJsonPositionSchema.parse([127.05, 37.5, 10, 99])).toThrow()
    })

    it('숫자가 아닌 값이 포함되면 실패', () => {
        expect(() => geoJsonPositionSchema.parse(['x', 37.5, 10])).toThrow()
    })
})
