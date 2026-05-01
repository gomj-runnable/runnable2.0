import { describe, it, expect } from 'vitest'
import {
    routeOptimizationModeSchema,
    routeOptimizeRequestSchema,
    RouteOptimizeRequestBody,
    RouteOptimizeResponseBody
} from '#shared/schemas/route-optimization.schema'

// ─── routeOptimizationModeSchema ──────────────────────────────────────────

describe('routeOptimizationModeSchema', () => {
    it('유효한 모드 NONE을 파싱한다', () => {
        expect(routeOptimizationModeSchema.parse('NONE')).toBe('NONE')
    })

    it('유효한 모드 TMAP을 파싱한다', () => {
        expect(routeOptimizationModeSchema.parse('TMAP')).toBe('TMAP')
    })

    it('유효한 모드 OSRM을 파싱한다', () => {
        expect(routeOptimizationModeSchema.parse('OSRM')).toBe('OSRM')
    })

    it('유효한 모드 BUILDING-AVOID를 파싱한다', () => {
        expect(routeOptimizationModeSchema.parse('BUILDING-AVOID')).toBe('BUILDING-AVOID')
    })

    it('존재하지 않는 모드는 실패한다', () => {
        const result = routeOptimizationModeSchema.safeParse('UNKNOWN')
        expect(result.success).toBe(false)
    })

    it('빈 문자열은 실패한다', () => {
        const result = routeOptimizationModeSchema.safeParse('')
        expect(result.success).toBe(false)
    })
})

// ─── routeOptimizeRequestSchema ───────────────────────────────────────────

describe('routeOptimizeRequestSchema', () => {
    const validPositions: [number, number, number][] = [
        [127.0, 37.5, 0],
        [127.1, 37.6, 10]
    ]

    it('유효한 요청 객체를 파싱한다', () => {
        const result = routeOptimizeRequestSchema.parse({ positions: validPositions, mode: 'NONE' })
        expect(result.positions).toHaveLength(2)
        expect(result.mode).toBe('NONE')
    })

    it('positions가 1개이면 실패한다(최소 2개 필요)', () => {
        const result = routeOptimizeRequestSchema.safeParse({
            positions: [[127.0, 37.5, 0]],
            mode: 'NONE'
        })
        expect(result.success).toBe(false)
    })

    it('positions가 빈 배열이면 실패한다', () => {
        const result = routeOptimizeRequestSchema.safeParse({ positions: [], mode: 'NONE' })
        expect(result.success).toBe(false)
    })

    it('mode가 유효하지 않으면 실패한다', () => {
        const result = routeOptimizeRequestSchema.safeParse({
            positions: validPositions,
            mode: 'INVALID'
        })
        expect(result.success).toBe(false)
    })

    it('각 좌표가 3개 숫자가 아니면 실패한다', () => {
        const result = routeOptimizeRequestSchema.safeParse({
            positions: [
                [127.0, 37.5],
                [127.1, 37.6]
            ], // 2개짜리 좌표
            mode: 'NONE'
        })
        expect(result.success).toBe(false)
    })
})

// ─── RouteOptimizeRequestBody ──────────────────────────────────────────────

describe('RouteOptimizeRequestBody', () => {
    const raw = {
        positions: [
            [127.0, 37.5, 0],
            [127.1, 37.6, 10]
        ],
        mode: 'TMAP'
    }

    it('fromRaw()이 유효한 데이터로 인스턴스를 생성한다', () => {
        const body = RouteOptimizeRequestBody.fromRaw(raw)
        expect(body.mode).toBe('TMAP')
        expect(body.positions).toHaveLength(2)
    })

    it('fromRaw()이 유효하지 않은 데이터이면 예외를 던진다', () => {
        expect(() => RouteOptimizeRequestBody.fromRaw({ positions: [], mode: 'TMAP' })).toThrow()
    })

    it('isServerRouted(): TMAP은 서버 라우팅이 필요하다', () => {
        const body = RouteOptimizeRequestBody.fromRaw(raw)
        expect(body.isServerRouted()).toBe(true)
    })

    it('isServerRouted(): NONE은 서버 라우팅이 필요하지 않다', () => {
        const body = RouteOptimizeRequestBody.fromRaw({ ...raw, mode: 'NONE' })
        expect(body.isServerRouted()).toBe(false)
    })

    it('isServerRouted(): OSRM은 서버 라우팅이 필요하다', () => {
        const body = RouteOptimizeRequestBody.fromRaw({ ...raw, mode: 'OSRM' })
        expect(body.isServerRouted()).toBe(true)
    })

    it('isServerRouted(): BUILDING-AVOID는 서버 라우팅이 필요하지 않다', () => {
        const body = RouteOptimizeRequestBody.fromRaw({ ...raw, mode: 'BUILDING-AVOID' })
        expect(body.isServerRouted()).toBe(false)
    })
})

// ─── RouteOptimizeResponseBody ─────────────────────────────────────────────

describe('RouteOptimizeResponseBody', () => {
    const positions: [number, number, number][] = [
        [127.0, 37.5, 0],
        [127.1, 37.6, 10]
    ]

    it('success()가 optimized=true인 인스턴스를 생성한다', () => {
        const body = RouteOptimizeResponseBody.success(positions, 'TMAP')
        expect(body.optimized).toBe(true)
        expect(body.isSuccess()).toBe(true)
        expect(body.mode).toBe('TMAP')
        expect(body.positions).toHaveLength(2)
    })

    it('success()로 생성된 인스턴스는 message가 없다', () => {
        const body = RouteOptimizeResponseBody.success(positions, 'NONE')
        expect(body.message).toBeUndefined()
    })

    it('fallback()이 optimized=false인 인스턴스를 생성한다', () => {
        const body = RouteOptimizeResponseBody.fallback(positions, 'TMAP', 'TMap 서버 오류')
        expect(body.optimized).toBe(false)
        expect(body.isSuccess()).toBe(false)
        expect(body.message).toBe('TMap 서버 오류')
    })

    it('fallback()에서 message를 생략하면 undefined다', () => {
        const body = RouteOptimizeResponseBody.fallback(positions, 'OSRM')
        expect(body.message).toBeUndefined()
    })

    it('fallback()은 원본 positions를 보존한다', () => {
        const body = RouteOptimizeResponseBody.fallback(positions, 'NONE')
        expect(body.positions).toEqual(positions)
    })
})
