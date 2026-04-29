import { describe, it, expect } from 'vitest'
import { formatPace, formatTime, calculateSectionDistance, calculateTotalTime, calculateTotalDistance } from '~/entities/route/lib/usePaceCalculator'
import type { SavedSection } from '#shared/types/route'

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────
const makeSection = (coords: [number, number][]): SavedSection =>
    ({
        sectionId: 'sec-1',
        routeId: 'route-1',
        seq: 0,
        geom: {
            type: 'LineString',
            coordinates: coords.map(([lng, lat]) => [lng, lat, 0])
        },
        attrs: []
    }) as unknown as SavedSection

// ─── formatPace ────────────────────────────────────────────────────────────
describe('formatPace', () => {
    it('0초는 0\'00" 형식이다', () => {
        expect(formatPace(0)).toBe("0'00\"")
    })

    it('60초는 1\'00" 형식이다', () => {
        expect(formatPace(60)).toBe("1'00\"")
    })

    it('90초는 1\'30" 형식이다', () => {
        expect(formatPace(90)).toBe("1'30\"")
    })

    it('3600초는 60\'00" 형식이다', () => {
        expect(formatPace(3600)).toBe("60'00\"")
    })

    it('330초는 5\'30" 형식이다', () => {
        expect(formatPace(330)).toBe("5'30\"")
    })

    it('초(seconds) 부분이 한 자리일 때 두 자리로 패딩된다', () => {
        expect(formatPace(61)).toBe("1'01\"")
    })
})

// ─── formatTime ───────────────────────────────────────────────────────────
describe('formatTime', () => {
    it('3600초 미만이면 "M분" 형식만 반환한다', () => {
        expect(formatTime(600)).toBe('10분')
    })

    it('0초는 "0분"이다', () => {
        expect(formatTime(0)).toBe('0분')
    })

    it('3600초는 "1시간 0분"이다', () => {
        expect(formatTime(3600)).toBe('1시간 0분')
    })

    it('5400초는 "1시간 30분"이다', () => {
        expect(formatTime(5400)).toBe('1시간 30분')
    })

    it('7200초는 "2시간 0분"이다', () => {
        expect(formatTime(7200)).toBe('2시간 0분')
    })
})

// ─── calculateSectionDistance ─────────────────────────────────────────────
describe('calculateSectionDistance', () => {
    it('좌표가 없으면 0을 반환한다', () => {
        const section = makeSection([])
        expect(calculateSectionDistance(section)).toBe(0)
    })

    it('좌표가 1개면 0을 반환한다', () => {
        const section = makeSection([[127.0, 37.5]])
        expect(calculateSectionDistance(section)).toBe(0)
    })

    it('두 지점 사이의 거리를 km 단위로 반환한다', () => {
        // 서울 시청 주변 두 점, 약 1.1km
        const section = makeSection([
            [126.977, 37.5665],
            [126.9882, 37.5665]
        ])
        const dist = calculateSectionDistance(section)
        expect(dist).toBeGreaterThan(0)
        expect(dist).toBeLessThan(5)
    })
})

// ─── calculateTotalDistance ───────────────────────────────────────────────
describe('calculateTotalDistance', () => {
    it('구간 목록이 비어 있으면 0을 반환한다', () => {
        expect(calculateTotalDistance([])).toBe(0)
    })

    it('여러 구간의 거리를 합산한다', () => {
        const sec1 = makeSection([[126.977, 37.5665], [126.978, 37.5665]])
        const sec2 = makeSection([[126.978, 37.5665], [126.979, 37.5665]])
        const total = calculateTotalDistance([sec1, sec2])
        const sum = calculateSectionDistance(sec1) + calculateSectionDistance(sec2)
        expect(total).toBeCloseTo(sum, 10)
    })
})

// ─── calculateTotalTime ───────────────────────────────────────────────────
describe('calculateTotalTime', () => {
    it('구간 목록이 비어 있으면 0을 반환한다', () => {
        expect(calculateTotalTime([], {})).toBe(0)
    })

    it('pace가 없는 구간은 기본값 330(초/km)으로 계산한다', () => {
        const section = makeSection([[126.977, 37.5665], [126.9882, 37.5665]])
        const distKm = calculateSectionDistance(section)
        const expected = Math.round(330 * distKm)
        expect(calculateTotalTime([section], {})).toBe(expected)
    })

    it('pace가 주어진 구간은 해당 pace로 계산한다', () => {
        const section = makeSection([[126.977, 37.5665], [126.9882, 37.5665]])
        section.sectionId = 'sec-test'
        const distKm = calculateSectionDistance(section)
        const pace = 300
        const expected = Math.round(pace * distKm)
        expect(calculateTotalTime([section], { 'sec-test': { pace } as any })).toBe(expected)
    })
})
