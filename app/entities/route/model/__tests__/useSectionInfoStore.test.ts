import { describe, it, expect } from 'vitest'
import type { SavedSection } from '#shared/types/route'
import { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────
const makeSection = (id: string): SavedSection =>
    ({
        sectionId: id,
        routeId: 'route-1',
        seq: 0,
        geom: { type: 'LineString', coordinates: [[127, 37, 0]] },
        attrs: [{ name: `구간 ${id}`, comment: '코멘트', description: '설명' }]
    }) as unknown as SavedSection

// ─── open ──────────────────────────────────────────────────────────────────
describe('useSectionInfoStore - open', () => {
    it('패널을 열면 isOpen이 true가 된다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])

        expect(store.isOpen.value).toBe(true)
        expect(store.selectedRouteId.value).toBe('route-1')
        expect(store.sections.value).toHaveLength(1)
    })

    it('isEditMode는 항상 false로 초기화된다', () => {
        const store = useSectionInfoStore()
        store.isEditMode.value = true
        store.open('route-1', [makeSection('s1')])

        expect(store.isEditMode.value).toBe(false)
    })

    it('각 구간에 대해 기본 userPaces를 초기화한다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1'), makeSection('s2')])

        expect(store.userPaces.value['s1']).toBeDefined()
        expect(store.userPaces.value['s1']!.pace).toBe(330)
        expect(store.userPaces.value['s1']!.weight).toBe(0)
        expect(store.userPaces.value['s1']!.strategy).toBe('')
        expect(store.userPaces.value['s2']).toBeDefined()
    })
})

// ─── open options ──────────────────────────────────────────────────────────
describe('useSectionInfoStore - open options', () => {
    it('readOnly 옵션이 true이면 readOnly 상태가 true가 된다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')], { readOnly: true })

        expect(store.readOnly.value).toBe(true)
    })

    it('readOnly 옵션이 없으면 readOnly는 false이다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])

        expect(store.readOnly.value).toBe(false)
    })

    it('title 옵션이 주어지면 panelTitle이 설정된다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')], { title: '경로 미리보기' })

        expect(store.panelTitle.value).toBe('경로 미리보기')
    })

    it('title 옵션이 없으면 기본값 "구간 정보"가 사용된다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])

        expect(store.panelTitle.value).toBe('구간 정보')
    })
})

// ─── close ─────────────────────────────────────────────────────────────────
describe('useSectionInfoStore - close', () => {
    it('패널을 닫으면 모든 상태가 초기화된다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')], { readOnly: true, title: '테스트' })
        store.close()

        expect(store.isOpen.value).toBe(false)
        expect(store.selectedRouteId.value).toBeNull()
        expect(store.sections.value).toHaveLength(0)
        expect(store.isEditMode.value).toBe(false)
        expect(store.readOnly.value).toBe(false)
    })
})

// ─── updatePace ────────────────────────────────────────────────────────────
describe('useSectionInfoStore - updatePace', () => {
    it('구간의 pace를 업데이트한다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])
        store.updatePace('s1', 300)

        expect(store.userPaces.value['s1']!.pace).toBe(300)
    })

    it('존재하지 않는 sectionId는 무시한다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])
        store.updatePace('non-existent', 300)

        expect(store.userPaces.value['non-existent']).toBeUndefined()
    })

    it('다른 필드는 변경되지 않는다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])
        store.updateWeight('s1', 5)
        store.updatePace('s1', 300)

        expect(store.userPaces.value['s1']!.weight).toBe(5)
    })
})

// ─── updateWeight ──────────────────────────────────────────────────────────
describe('useSectionInfoStore - updateWeight', () => {
    it('구간의 weight를 업데이트한다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])
        store.updateWeight('s1', 10)

        expect(store.userPaces.value['s1']!.weight).toBe(10)
    })
})

// ─── updateStrategy ────────────────────────────────────────────────────────
describe('useSectionInfoStore - updateStrategy', () => {
    it('구간의 strategy를 업데이트한다', () => {
        const store = useSectionInfoStore()
        store.open('route-1', [makeSection('s1')])
        store.updateStrategy('s1', '빠르게 달리기')

        expect(store.userPaces.value['s1']!.strategy).toBe('빠르게 달리기')
    })
})
