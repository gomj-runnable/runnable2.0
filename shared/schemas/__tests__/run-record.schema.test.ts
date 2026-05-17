import { describe, it, expect } from 'vitest'
import { createRunRecordSchema } from '#shared/schemas/run-record.schema'

describe('createRunRecordSchema', () => {
    const validInput = {
        runDate: '2026-05-17',
        distanceKm: 5.2,
        durationSec: 1560,
        avgPaceSecPerKm: 300,
        rpe: 7,
        condition: 'good' as const
    }

    it('유효한 최소 입력을 파싱한다', () => {
        const result = createRunRecordSchema.parse(validInput)
        expect(result.rpe).toBe(7)
        expect(result.condition).toBe('good')
        expect(result.distanceKm).toBe(5.2)
    })

    it('전체 필드를 파싱한다', () => {
        const full = {
            ...validInput,
            routeId: 'route-123',
            sleepHours: 7.5,
            stressLevel: 3,
            painAreas: ['오른쪽 무릎', '왼쪽 발목'],
            weatherSnapshot: { tempC: 22, humidity: 65, pm10: 35 },
            notes: '5km 지점부터 호흡 무거움'
        }
        const result = createRunRecordSchema.parse(full)
        expect(result.painAreas).toHaveLength(2)
        expect(result.weatherSnapshot?.tempC).toBe(22)
        expect(result.notes).toContain('호흡')
    })

    it('RPE 범위: 1~10', () => {
        expect(() => createRunRecordSchema.parse({ ...validInput, rpe: 0 })).toThrow()
        expect(() => createRunRecordSchema.parse({ ...validInput, rpe: 11 })).toThrow()
        expect(createRunRecordSchema.parse({ ...validInput, rpe: 1 }).rpe).toBe(1)
        expect(createRunRecordSchema.parse({ ...validInput, rpe: 10 }).rpe).toBe(10)
    })

    it('condition 은 good/normal/bad 만 허용', () => {
        expect(() =>
            createRunRecordSchema.parse({ ...validInput, condition: 'excellent' })
        ).toThrow()
    })

    it('stressLevel 범위: 1~5', () => {
        expect(() => createRunRecordSchema.parse({ ...validInput, stressLevel: 0 })).toThrow()
        expect(() => createRunRecordSchema.parse({ ...validInput, stressLevel: 6 })).toThrow()
    })

    it('distanceKm 은 200km 초과 불가', () => {
        expect(() => createRunRecordSchema.parse({ ...validInput, distanceKm: 201 })).toThrow()
    })

    it('painAreas 는 최대 10개', () => {
        const tooMany = Array.from({ length: 11 }, (_, i) => `부위${i}`)
        expect(() => createRunRecordSchema.parse({ ...validInput, painAreas: tooMany })).toThrow()
    })

    it('notes 는 최대 1000자', () => {
        const longNote = 'a'.repeat(1001)
        expect(() => createRunRecordSchema.parse({ ...validInput, notes: longNote })).toThrow()
    })
})
