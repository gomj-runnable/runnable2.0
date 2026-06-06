import { describe, it, expect } from 'vitest'
import {
    toPoiDto,
    facilityToPoiDraft,
    SEARCHABLE_FACILITY_TYPES
} from '~/entities/facility/lib/useFacilityConversion'
import type { Facility } from '#shared/types/facility'

const facility = (overrides: Partial<Facility> = {}): Facility =>
    ({
        id: 'f-1',
        type: 'toilet',
        name: '약수터',
        description: '맑은 물',
        geometry: { type: 'Point', coordinates: [127.001, 37.5] },
        attributes: [],
        references: [],
        ...overrides
    }) as Facility

describe('SEARCHABLE_FACILITY_TYPES', () => {
    it('crosswalk/fountain/toilet/locker 4개', () => {
        expect(SEARCHABLE_FACILITY_TYPES).toEqual(['crosswalk', 'fountain', 'toilet', 'locker'])
    })
})

describe('toPoiDto()', () => {
    it('Facility → PoiDto 매핑', () => {
        const dto = toPoiDto(facility())
        expect(dto).toEqual({
            id: 'f-1',
            lon: 127.001,
            lat: 37.5,
            name: '약수터',
            descript: '맑은 물'
        })
    })

    it('description 누락 시 빈 문자열', () => {
        const dto = toPoiDto(facility({ description: undefined as any }))
        expect(dto.descript).toBe('')
    })
})

describe('facilityToPoiDraft()', () => {
    it('정상 type → poiType 매핑된 결과', () => {
        const draft = facilityToPoiDraft(facility({ type: 'fountain' }))
        expect(draft).not.toBeNull()
        expect(draft!.name).toBe('약수터')
        expect(draft!.geom.coordinates).toEqual([127.001, 37.5])
    })

    it('지원되지 않는 type 은 null', () => {
        const draft = facilityToPoiDraft(facility({ type: 'unknown-type' as any }))
        expect(draft).toBeNull()
    })
})
