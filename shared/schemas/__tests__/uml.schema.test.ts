import { describe, it, expect } from 'vitest'
import {
    domainTabSchema,
    diagramTypeSchema,
    analyzeRequestSchema
} from '#shared/schemas/uml.schema'

describe('domainTabSchema', () => {
    it.each(['planning', 'frontend', 'backend', 'library'])('%s 는 유효한 도메인', (val) => {
        expect(domainTabSchema.safeParse(val).success).toBe(true)
    })

    it('잘못된 도메인은 거부', () => {
        expect(domainTabSchema.safeParse('unknown').success).toBe(false)
        expect(domainTabSchema.safeParse('').success).toBe(false)
        expect(domainTabSchema.safeParse(123).success).toBe(false)
    })
})

describe('diagramTypeSchema', () => {
    it.each(['class', 'flowchart', 'sequence', 'dependency'])(
        '%s 는 유효한 다이어그램 타입',
        (val) => {
            expect(diagramTypeSchema.safeParse(val).success).toBe(true)
        }
    )

    it('잘못된 타입은 거부', () => {
        expect(diagramTypeSchema.safeParse('pie').success).toBe(false)
        expect(diagramTypeSchema.safeParse(null).success).toBe(false)
    })
})

describe('analyzeRequestSchema', () => {
    const valid = {
        domain: 'frontend',
        featureIds: ['frontend:pages:auth'],
        diagramType: 'flowchart'
    }

    it('유효한 요청 통과', () => {
        const result = analyzeRequestSchema.safeParse(valid)
        expect(result.success).toBe(true)
    })

    it('featureIds 빈 배열은 거부 (min 1)', () => {
        const result = analyzeRequestSchema.safeParse({ ...valid, featureIds: [] })
        expect(result.success).toBe(false)
    })

    it('featureIds 빈 문자열 요소 거부 (min 1 char)', () => {
        const result = analyzeRequestSchema.safeParse({ ...valid, featureIds: [''] })
        expect(result.success).toBe(false)
    })

    it('featureIds 50개 초과 거부', () => {
        const ids = Array.from({ length: 51 }, (_, i) => `id-${i}`)
        const result = analyzeRequestSchema.safeParse({ ...valid, featureIds: ids })
        expect(result.success).toBe(false)
    })

    it('featureIds 50개는 통과', () => {
        const ids = Array.from({ length: 50 }, (_, i) => `id-${i}`)
        const result = analyzeRequestSchema.safeParse({ ...valid, featureIds: ids })
        expect(result.success).toBe(true)
    })

    it('domain 누락 시 거부', () => {
        const { domain: _, ...rest } = valid
        expect(analyzeRequestSchema.safeParse(rest).success).toBe(false)
    })

    it('diagramType 누락 시 거부', () => {
        const { diagramType: _, ...rest } = valid
        expect(analyzeRequestSchema.safeParse(rest).success).toBe(false)
    })
})
