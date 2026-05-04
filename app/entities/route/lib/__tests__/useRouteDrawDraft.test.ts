import { describe, it, expect } from 'vitest'
import {
    createDefaultSectionAttr,
    createInitialSectionPointRanges,
    createWaypointBasedSectionRanges,
    updateSectionDraftAttr,
    removeSectionDraftAttr,
    mergeSectionPointRanges,
    splitSectionPointRange,
    splitSectionAtPoint,
    syncSectionAttrs,
    type SectionPointRange
} from '~/entities/route/lib/useRouteDrawDraft'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'

// ─── createDefaultSectionAttr ────────────────────────────────────────────
describe('createDefaultSectionAttr', () => {
    it('주어진 index를 seq로 갖는 기본 객체를 반환한다', () => {
        const attr = createDefaultSectionAttr(3)
        expect(attr.seq).toBe(3)
    })

    it('name, comment, description은 undefined이다', () => {
        const attr = createDefaultSectionAttr(0)
        expect(attr.name).toBeUndefined()
        expect(attr.comment).toBeUndefined()
        expect(attr.description).toBeUndefined()
    })
})

// ─── createInitialSectionPointRanges ─────────────────────────────────────
describe('createInitialSectionPointRanges', () => {
    it('포인트가 0개이면 빈 배열을 반환한다', () => {
        expect(createInitialSectionPointRanges(0)).toEqual([])
    })

    it('포인트가 1개이면 빈 배열을 반환한다', () => {
        expect(createInitialSectionPointRanges(1)).toEqual([])
    })

    it('포인트가 2개이면 구간이 1개 생성된다', () => {
        const ranges = createInitialSectionPointRanges(2)
        expect(ranges).toHaveLength(1)
        expect(ranges[0]).toEqual({ start: 0, end: 1 })
    })

    it('포인트가 N개이면 N-1개의 인접 구간을 생성한다', () => {
        const ranges = createInitialSectionPointRanges(5)
        expect(ranges).toHaveLength(4)
        expect(ranges[0]).toEqual({ start: 0, end: 1 })
        expect(ranges[3]).toEqual({ start: 3, end: 4 })
    })
})

// ─── createWaypointBasedSectionRanges ────────────────────────────────────
describe('createWaypointBasedSectionRanges', () => {
    it('waypoint가 1개 이하이면 초기 구간 범위를 반환한다', () => {
        const positions: [number, number, number][] = [
            [0, 0, 0],
            [1, 0, 0],
            [2, 0, 0]
        ]
        const result = createWaypointBasedSectionRanges(positions, [[0, 0, 0]])
        // createInitialSectionPointRanges(3) = [{start:0,end:1},{start:1,end:2}]
        expect(result).toEqual([
            { start: 0, end: 1 },
            { start: 1, end: 2 }
        ])
    })

    it('최적화 포인트가 1개 이하이면 초기 구간 범위를 반환한다', () => {
        const result = createWaypointBasedSectionRanges(
            [[0, 0, 0]],
            [
                [0, 0, 0],
                [1, 0, 0]
            ]
        )
        expect(result).toEqual([])
    })

    it('waypoint 기준으로 구간 범위를 생성한다', () => {
        // 5개 최적화 포인트, 3개 waypoint → 2개 구간
        const optimized: [number, number, number][] = [
            [0, 0, 0],
            [1, 0, 0],
            [2, 0, 0],
            [3, 0, 0],
            [4, 0, 0]
        ]
        const waypoints: [number, number, number][] = [
            [0, 0, 0],
            [2, 0, 0],
            [4, 0, 0]
        ]
        const result = createWaypointBasedSectionRanges(optimized, waypoints)
        expect(result).toHaveLength(2)
        expect(result[0]!.start).toBe(0)
        // 마지막 waypoint는 항상 마지막 인덱스(4)를 가리킨다
        expect(result[result.length - 1]!.end).toBe(4)
    })

    it('마지막 구간의 end는 항상 optimizedPositions의 마지막 인덱스이다', () => {
        const optimized: [number, number, number][] = [
            [0, 0, 0],
            [1, 0, 0],
            [2, 0, 0]
        ]
        const waypoints: [number, number, number][] = [
            [0, 0, 0],
            [2, 0, 0]
        ]
        const result = createWaypointBasedSectionRanges(optimized, waypoints)
        expect(result[result.length - 1]!.end).toBe(2)
    })
})

// ─── updateSectionDraftAttr ──────────────────────────────────────────────
describe('updateSectionDraftAttr', () => {
    const baseDraft: CreateSectionSchema = {
        routeId: 'draft-route',
        attrs: [{ seq: 0, name: undefined, comment: undefined, description: undefined }]
    }

    it('지정한 필드를 업데이트한 새 객체를 반환한다', () => {
        const updated = updateSectionDraftAttr(baseDraft, {
            index: 0,
            field: 'name',
            value: '구간1'
        })
        expect(updated.attrs![0]!.name).toBe('구간1')
    })

    it('원본 draft는 변경되지 않는다 (불변)', () => {
        updateSectionDraftAttr(baseDraft, { index: 0, field: 'name', value: '변경됨' })
        expect(baseDraft.attrs![0]!.name).toBeUndefined()
    })

    it('빈 문자열 입력은 undefined로 저장된다', () => {
        const updated = updateSectionDraftAttr(baseDraft, { index: 0, field: 'comment', value: '' })
        expect(updated.attrs![0]!.comment).toBeUndefined()
    })

    it('attrs가 없는 인덱스에 업데이트하면 기본값으로 생성된다', () => {
        const emptyDraft: CreateSectionSchema = { routeId: 'draft-route', attrs: [] }
        const updated = updateSectionDraftAttr(emptyDraft, {
            index: 2,
            field: 'name',
            value: '신규'
        })
        expect(updated.attrs![2]!.name).toBe('신규')
        expect(updated.attrs![2]!.seq).toBe(2)
    })
})

// ─── removeSectionDraftAttr ──────────────────────────────────────────────
describe('removeSectionDraftAttr', () => {
    const draftWith3: CreateSectionSchema = {
        routeId: 'draft-route',
        attrs: [
            { seq: 0, name: 'A' },
            { seq: 1, name: 'B' },
            { seq: 2, name: 'C' }
        ]
    }

    it('지정한 인덱스의 속성을 제거한다', () => {
        const result = removeSectionDraftAttr(draftWith3, 1)
        expect(result.attrs).toHaveLength(2)
        expect(result.attrs!.find((a) => a.name === 'B')).toBeUndefined()
    })

    it('제거 후 나머지 속성의 seq가 재정렬된다', () => {
        const result = removeSectionDraftAttr(draftWith3, 0)
        expect(result.attrs![0]!.seq).toBe(0)
        expect(result.attrs![1]!.seq).toBe(1)
    })

    it('원본 draft는 변경되지 않는다 (불변)', () => {
        removeSectionDraftAttr(draftWith3, 0)
        expect(draftWith3.attrs).toHaveLength(3)
    })
})

// ─── mergeSectionPointRanges ─────────────────────────────────────────────
describe('mergeSectionPointRanges', () => {
    const ranges: SectionPointRange[] = [
        { start: 0, end: 2 },
        { start: 2, end: 5 },
        { start: 5, end: 8 }
    ]

    it('index 0은 병합하지 않고 원본을 반환한다', () => {
        expect(mergeSectionPointRanges(ranges, 0)).toBe(ranges)
    })

    it('범위를 초과하는 index는 원본을 반환한다', () => {
        expect(mergeSectionPointRanges(ranges, 10)).toBe(ranges)
    })

    it('index 1을 병합하면 0번 구간의 end가 확장된다', () => {
        const result = mergeSectionPointRanges(ranges, 1)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ start: 0, end: 5 })
    })

    it('병합 후 제거된 구간은 배열에서 사라진다', () => {
        const result = mergeSectionPointRanges(ranges, 2)
        expect(result).toHaveLength(2)
        expect(result[1]).toEqual({ start: 2, end: 8 })
    })

    it('원본 배열은 변경되지 않는다 (불변)', () => {
        mergeSectionPointRanges(ranges, 1)
        expect(ranges).toHaveLength(3)
    })
})

// ─── syncSectionAttrs ────────────────────────────────────────────────────
describe('syncSectionAttrs', () => {
    it('ranges 수에 맞게 attrs를 동기화한다', () => {
        const attrs = [
            { seq: 0, name: 'A' },
            { seq: 1, name: 'B' },
            { seq: 2, name: 'C' }
        ]
        const ranges: SectionPointRange[] = [
            { start: 0, end: 1 },
            { start: 1, end: 2 }
        ]
        const result = syncSectionAttrs(attrs, ranges)
        expect(result).toHaveLength(2)
        expect(result[0]!.seq).toBe(0)
        expect(result[1]!.seq).toBe(1)
    })

    it('기존 attrs가 부족하면 기본값으로 채운다', () => {
        const ranges: SectionPointRange[] = [
            { start: 0, end: 1 },
            { start: 1, end: 2 },
            { start: 2, end: 3 }
        ]
        const result = syncSectionAttrs([], ranges)
        expect(result).toHaveLength(3)
        expect(result[2]!.seq).toBe(2)
        expect(result[2]!.name).toBeUndefined()
    })

    it('기존 attrs의 데이터는 유지된다', () => {
        const attrs = [{ seq: 0, name: '유지됨', comment: '코멘트' }]
        const ranges: SectionPointRange[] = [{ start: 0, end: 1 }]
        const result = syncSectionAttrs(attrs, ranges)
        expect(result[0]!.name).toBe('유지됨')
        expect(result[0]!.comment).toBe('코멘트')
    })
})

// ─── splitSectionPointRange ─────────────────────────────────────────────
describe('splitSectionPointRange', () => {
    it('구간을 중간 지점에서 둘로 분할한다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 4 }]
        const result = splitSectionPointRange(ranges, 0)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ start: 0, end: 2 })
        expect(result[1]).toEqual({ start: 2, end: 4 })
    })

    it('포인트가 2개 미만인 구간은 분할하지 않는다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 1 }]
        const result = splitSectionPointRange(ranges, 0)

        expect(result).toHaveLength(1)
    })

    it('여러 구간 중 특정 구간만 분할한다', () => {
        const ranges: SectionPointRange[] = [
            { start: 0, end: 2 },
            { start: 2, end: 6 },
            { start: 6, end: 8 }
        ]
        const result = splitSectionPointRange(ranges, 1)

        expect(result).toHaveLength(4)
        expect(result[0]).toEqual({ start: 0, end: 2 })
        expect(result[1]).toEqual({ start: 2, end: 4 })
        expect(result[2]).toEqual({ start: 4, end: 6 })
        expect(result[3]).toEqual({ start: 6, end: 8 })
    })

    it('범위 밖 인덱스는 원본을 반환한다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 4 }]
        const result = splitSectionPointRange(ranges, 5)

        expect(result).toEqual(ranges)
    })
})

// ─── splitSectionAtPoint ────────────────────────────────────────────────
describe('splitSectionAtPoint', () => {
    it('지정한 포인트에서 구간을 둘로 분할한다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 6 }]
        const result = splitSectionAtPoint(ranges, 0, 3)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ start: 0, end: 3 })
        expect(result[1]).toEqual({ start: 3, end: 6 })
    })

    it('구간의 시작 포인트에서는 분할하지 않는다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 6 }]
        const result = splitSectionAtPoint(ranges, 0, 0)

        expect(result).toEqual(ranges)
    })

    it('구간의 끝 포인트에서는 분할하지 않는다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 6 }]
        const result = splitSectionAtPoint(ranges, 0, 6)

        expect(result).toEqual(ranges)
    })

    it('여러 구간 중 특정 구간만 지정 포인트에서 분할한다', () => {
        const ranges: SectionPointRange[] = [
            { start: 0, end: 3 },
            { start: 3, end: 8 },
            { start: 8, end: 10 }
        ]
        const result = splitSectionAtPoint(ranges, 1, 5)

        expect(result).toHaveLength(4)
        expect(result[0]).toEqual({ start: 0, end: 3 })
        expect(result[1]).toEqual({ start: 3, end: 5 })
        expect(result[2]).toEqual({ start: 5, end: 8 })
        expect(result[3]).toEqual({ start: 8, end: 10 })
    })

    it('범위 밖 포인트 인덱스는 원본을 반환한다', () => {
        const ranges: SectionPointRange[] = [{ start: 0, end: 6 }]
        const result = splitSectionAtPoint(ranges, 0, 10)

        expect(result).toEqual(ranges)
    })
})
