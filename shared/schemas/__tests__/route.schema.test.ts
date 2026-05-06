import { describe, it, expect } from 'vitest'
import {
    geoJsonPointSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema,
    createRouteSchema
} from '#shared/schemas/route.schema'

// ─── geoJsonPointSchema ────────────────────────────────────────────────────

describe('geoJsonPointSchema', () => {
    it('유효한 2차원 좌표(lon, lat)를 파싱한다', () => {
        const result = geoJsonPointSchema.parse({ type: 'Point', coordinates: [127.0, 37.5] })
        expect(result.coordinates).toEqual([127.0, 37.5])
    })

    it('유효한 3차원 좌표(lon, lat, alt)를 파싱한다', () => {
        const result = geoJsonPointSchema.parse({ type: 'Point', coordinates: [127.0, 37.5, 50] })
        expect(result.coordinates).toEqual([127.0, 37.5, 50])
    })

    it('좌표가 1개이면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'Point', coordinates: [127.0] })
        expect(result.success).toBe(false)
    })

    it('좌표가 4개 이상이면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'Point', coordinates: [1, 2, 3, 4] })
        expect(result.success).toBe(false)
    })

    it('type이 Point가 아니면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({
            type: 'LineString',
            coordinates: [127.0, 37.5]
        })
        expect(result.success).toBe(false)
    })

    it('coordinates가 없으면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'Point' })
        expect(result.success).toBe(false)
    })
})

// ─── geoJsonLineStringSchema ───────────────────────────────────────────────

describe('geoJsonLineStringSchema', () => {
    it('유효한 LineString(3차원 좌표 배열)을 파싱한다', () => {
        const data = {
            type: 'LineString',
            coordinates: [
                [127.0, 37.5, 10],
                [127.1, 37.6, 20]
            ]
        }
        const result = geoJsonLineStringSchema.parse(data)
        expect(result.type).toBe('LineString')
        expect(result.coordinates).toHaveLength(2)
    })

    it('좌표가 빈 배열이어도 파싱된다', () => {
        const result = geoJsonLineStringSchema.parse({ type: 'LineString', coordinates: [] })
        expect(result.coordinates).toEqual([])
    })

    it('각 좌표가 3개 숫자가 아니면 실패한다', () => {
        const result = geoJsonLineStringSchema.safeParse({
            type: 'LineString',
            coordinates: [[127.0, 37.5]] // 2개짜리 tuple은 실패
        })
        expect(result.success).toBe(false)
    })

    it('type이 LineString이 아니면 실패한다', () => {
        const result = geoJsonLineStringSchema.safeParse({
            type: 'Point',
            coordinates: [[127.0, 37.5, 10]]
        })
        expect(result.success).toBe(false)
    })
})

// ─── sectionAttrSchema ────────────────────────────────────────────────────

describe('sectionAttrSchema', () => {
    it('seq만 있어도 파싱된다', () => {
        const result = sectionAttrSchema.parse({ seq: 1 })
        expect(result.seq).toBe(1)
    })

    it('모든 필드가 있으면 파싱된다', () => {
        const result = sectionAttrSchema.parse({
            seq: 2,
            name: '구간 A',
            comment: '메모',
            description: '설명'
        })
        expect(result.name).toBe('구간 A')
    })

    it('seq가 없으면 실패한다', () => {
        const result = sectionAttrSchema.safeParse({ name: '구간 A' })
        expect(result.success).toBe(false)
    })

    it('seq가 정수가 아닌 소수이면 실패한다', () => {
        const result = sectionAttrSchema.safeParse({ seq: 1.5 })
        expect(result.success).toBe(false)
    })
})

// ─── createRouteSchema ────────────────────────────────────────────────────

describe('createRouteSchema', () => {
    it('title만 있어도 파싱된다', () => {
        const result = createRouteSchema.parse({ title: '한강 코스' })
        expect(result.title).toBe('한강 코스')
        expect(result.isPublic).toBe(true) // default
    })

    it('모든 선택 필드를 포함하면 파싱된다', () => {
        const result = createRouteSchema.parse({
            title: '북악 코스',
            description: '설명',
            highHeight: 150,
            lowHeight: 10,
            distance: 5000,
            sgg: ['종로구'],
            emd: ['청운동'],
            isPublic: false
        })
        expect(result.isPublic).toBe(false)
        expect(result.distance).toBe(5000)
    })

    it('title이 빈 문자열이면 실패한다', () => {
        const result = createRouteSchema.safeParse({ title: '' })
        expect(result.success).toBe(false)
    })

    it('title이 255자를 초과하면 실패한다', () => {
        const result = createRouteSchema.safeParse({ title: 'a'.repeat(256) })
        expect(result.success).toBe(false)
    })

    it('distance가 음수이면 실패한다', () => {
        const result = createRouteSchema.safeParse({ title: '코스', distance: -1 })
        expect(result.success).toBe(false)
    })
})
