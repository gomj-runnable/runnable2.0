import { describe, it, expect } from 'vitest'
import {
    ELEVATION_ENTRIES,
    ELEVATION_ALPHA
} from '~/features/elevation-layer/lib/useElevationBands'

describe('ELEVATION_ENTRIES', () => {
    it('9개 색상 밴드 (SEOUL_MIN ~ SEOUL_MAX)', () => {
        expect(ELEVATION_ENTRIES).toHaveLength(9)
    })

    it('첫 height 는 5 (SEOUL_MIN), 마지막 은 836 (SEOUL_MAX)', () => {
        expect(ELEVATION_ENTRIES[0]!.height).toBe(5)
        expect(ELEVATION_ENTRIES.at(-1)!.height).toBe(836)
    })

    it('height 는 단조증가', () => {
        for (let i = 1; i < ELEVATION_ENTRIES.length; i++) {
            expect(ELEVATION_ENTRIES[i]!.height).toBeGreaterThan(ELEVATION_ENTRIES[i - 1]!.height)
        }
    })

    it('color 는 #RRGGBB 형식의 string', () => {
        for (const e of ELEVATION_ENTRIES) {
            expect(e.color).toMatch(/^#[0-9A-F]{6}$/)
        }
    })

    it('ELEVATION_ALPHA 는 0~1 범위', () => {
        expect(ELEVATION_ALPHA).toBeGreaterThan(0)
        expect(ELEVATION_ALPHA).toBeLessThanOrEqual(1)
    })
})
