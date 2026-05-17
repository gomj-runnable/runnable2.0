import { describe, it, expect } from 'vitest'
import { createSegmentSchema, createEffortSchema } from '#shared/schemas/segment.schema'

describe('createSegmentSchema', () => {
    const validInput = {
        name: '한강대교-동작대교',
        routeId: 'route-123',
        startPositionIndex: 10,
        endPositionIndex: 50,
        distanceKm: 1.2,
        isPublic: true
    }

    it('유효한 입력을 파싱한다', () => {
        const result = createSegmentSchema.parse(validInput)
        expect(result.name).toBe('한강대교-동작대교')
        expect(result.distanceKm).toBe(1.2)
        expect(result.isPublic).toBe(true)
    })

    it('이름이 빈 문자열이면 실패', () => {
        expect(() => createSegmentSchema.parse({ ...validInput, name: '' })).toThrow()
    })

    it('distanceKm 이 0 이하이면 실패', () => {
        expect(() => createSegmentSchema.parse({ ...validInput, distanceKm: 0 })).toThrow()
        expect(() => createSegmentSchema.parse({ ...validInput, distanceKm: -1 })).toThrow()
    })

    it('100km 초과 거리는 실패', () => {
        expect(() => createSegmentSchema.parse({ ...validInput, distanceKm: 101 })).toThrow()
    })

    it('description 은 선택 사항', () => {
        const result = createSegmentSchema.parse({ ...validInput, description: '좋은 구간' })
        expect(result.description).toBe('좋은 구간')
    })

    it('elevationGainM 은 선택 사항', () => {
        const result = createSegmentSchema.parse({ ...validInput, elevationGainM: 15.5 })
        expect(result.elevationGainM).toBe(15.5)
    })
})

describe('createEffortSchema', () => {
    const validInput = {
        segmentId: 'seg-123',
        durationSec: 360,
        paceSecPerKm: 300
    }

    it('유효한 입력을 파싱한다', () => {
        const result = createEffortSchema.parse(validInput)
        expect(result.durationSec).toBe(360)
        expect(result.paceSecPerKm).toBe(300)
    })

    it('durationSec 이 0 이하이면 실패', () => {
        expect(() => createEffortSchema.parse({ ...validInput, durationSec: 0 })).toThrow()
    })

    it('paceSecPerKm 이 0 이하이면 실패', () => {
        expect(() => createEffortSchema.parse({ ...validInput, paceSecPerKm: 0 })).toThrow()
    })
})
