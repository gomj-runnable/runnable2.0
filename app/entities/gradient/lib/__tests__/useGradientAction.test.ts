import { describe, it, expect } from 'vitest'
import { useGradientAction } from '~/entities/gradient/lib/useGradientAction'
import { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'

const { getGradientColor, classifyDifficulty, calculateSegmentGradients } = useGradientAction()

// ─── getGradientColor ─────────────────────────────────────────────────────
describe('getGradientColor', () => {
    it('0~3% 미만은 초록색(#4CAF50)이다', () => {
        expect(getGradientColor(0)).toBe('#4CAF50')
        expect(getGradientColor(2.9)).toBe('#4CAF50')
    })

    it('3~7% 미만은 노란색(#FFC107)이다', () => {
        expect(getGradientColor(3)).toBe('#FFC107')
        expect(getGradientColor(6.9)).toBe('#FFC107')
    })

    it('7~12% 미만은 주황색(#FF9800)이다', () => {
        expect(getGradientColor(7)).toBe('#FF9800')
        expect(getGradientColor(11.9)).toBe('#FF9800')
    })

    it('12% 이상은 빨간색(#F44336)이다', () => {
        expect(getGradientColor(12)).toBe('#F44336')
        expect(getGradientColor(20)).toBe('#F44336')
    })

    it('음수 경사도(내리막)도 절댓값으로 분류한다', () => {
        expect(getGradientColor(-2)).toBe('#4CAF50')
        expect(getGradientColor(-5)).toBe('#FFC107')
        expect(getGradientColor(-10)).toBe('#FF9800')
        expect(getGradientColor(-15)).toBe('#F44336')
    })
})

// ─── classifyDifficulty ───────────────────────────────────────────────────
describe('classifyDifficulty', () => {
    it('거리·고도·경사도 모두 초급 기준이면 BEGINNER를 반환한다', () => {
        expect(classifyDifficulty(3, 50, 2)).toBe(DifficultyLevelEnum.BEGINNER)
    })

    it('거리가 중급 기준이면 INTERMEDIATE 이상을 반환한다', () => {
        const result = classifyDifficulty(7, 50, 2)
        expect(result.order).toBeGreaterThanOrEqual(DifficultyLevelEnum.INTERMEDIATE.order)
    })

    it('거리가 20km 초과이면 EXPERT를 반환한다', () => {
        expect(classifyDifficulty(21, 50, 2)).toBe(DifficultyLevelEnum.EXPERT)
    })

    it('고도가 600m 초과이면 EXPERT를 반환한다', () => {
        expect(classifyDifficulty(3, 601, 2)).toBe(DifficultyLevelEnum.EXPERT)
    })

    it('경사도가 12% 초과이면 EXPERT를 반환한다', () => {
        expect(classifyDifficulty(3, 50, 13)).toBe(DifficultyLevelEnum.EXPERT)
    })

    it('세 기준 중 가장 높은 등급을 채택한다', () => {
        // 거리=초급, 고도=중급, 경사도=초급 → INTERMEDIATE
        expect(classifyDifficulty(3, 200, 2)).toBe(DifficultyLevelEnum.INTERMEDIATE)
    })

    it('경사도가 고급이면 거리가 초급이어도 ADVANCED 이상이다', () => {
        const result = classifyDifficulty(3, 50, 9)
        expect(result.order).toBeGreaterThanOrEqual(DifficultyLevelEnum.ADVANCED.order)
    })

    it('경계값: 거리 10km는 INTERMEDIATE이다 (10km 초과 기준)', () => {
        // distanceKm > 10이 ADVANCED 기준이므로 10은 INTERMEDIATE
        const result = classifyDifficulty(10, 0, 0)
        expect(result.order).toBeGreaterThanOrEqual(DifficultyLevelEnum.INTERMEDIATE.order)
    })
})

// ─── calculateSegmentGradients ────────────────────────────────────────────
describe('calculateSegmentGradients', () => {
    it('좌표가 2개 미만이면 빈 배열을 반환한다', () => {
        expect(calculateSegmentGradients([])).toEqual([])
        expect(calculateSegmentGradients([[127, 37, 0]])).toEqual([])
    })

    it('N개 좌표로 N-1개 구간을 생성한다', () => {
        const coords: [number, number, number][] = [
            [126.977, 37.5665, 0],
            [126.978, 37.5665, 10],
            [126.979, 37.5665, 20]
        ]
        const result = calculateSegmentGradients(coords)
        expect(result).toHaveLength(2)
    })

    it('각 구간에 startIndex, endIndex, gradient, color 필드가 있다', () => {
        const coords: [number, number, number][] = [
            [126.977, 37.5665, 0],
            [126.978, 37.5665, 10]
        ]
        const result = calculateSegmentGradients(coords)
        expect(result[0]).toHaveProperty('startIndex', 0)
        expect(result[0]).toHaveProperty('endIndex', 1)
        expect(result[0]).toHaveProperty('gradient')
        expect(result[0]).toHaveProperty('color')
    })

    it('오르막 구간의 경사도는 양수이다', () => {
        const coords: [number, number, number][] = [
            [126.977, 37.5665, 0],
            [126.978, 37.5665, 50]
        ]
        expect(calculateSegmentGradients(coords)[0]!.gradient).toBeGreaterThan(0)
    })

    it('내리막 구간의 경사도는 음수이다', () => {
        const coords: [number, number, number][] = [
            [126.977, 37.5665, 50],
            [126.978, 37.5665, 0]
        ]
        expect(calculateSegmentGradients(coords)[0]!.gradient).toBeLessThan(0)
    })

    it('고도가 같은 구간의 경사도는 0이다', () => {
        const coords: [number, number, number][] = [
            [126.977, 37.5665, 100],
            [126.978, 37.5665, 100]
        ]
        expect(calculateSegmentGradients(coords)[0]!.gradient).toBe(0)
    })

    it('color 필드는 getGradientColor 결과와 일치한다', () => {
        const coords: [number, number, number][] = [
            [126.977, 37.5665, 0],
            [126.978, 37.5665, 0]
        ]
        const [seg] = calculateSegmentGradients(coords)
        expect(seg!.color).toBe(getGradientColor(seg!.gradient))
    })
})
