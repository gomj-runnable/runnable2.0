import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import { useSlideOverNav } from '../useSlideOverNav'
import { NavKey } from '../nav-key'

// useAuthStore는 isAuthModalOpen ref만 사용한다. 테스트는 그 동작에 의존하지 않으므로
// 가벼운 stub으로 대체한다.
vi.mock('~/entities/user/model/useAuthStore', () => {
    const isAuthModalOpen = ref(false)
    return {
        useAuthStore: () => ({
            isAuthModalOpen,
            isLoggedIn: ref(false),
            closeAuthModal: () => {
                isAuthModalOpen.value = false
            }
        })
    }
})

describe('useSlideOverNav', () => {
    let activeNav: Ref<string>

    beforeEach(() => {
        // 진입 기본 탭은 EXPLORE (#260)
        activeNav = ref<string>(NavKey.EXPLORE)
    })

    describe('select() - Nav Rail 클릭 핸들러', () => {
        it('다른 항목을 선택하면 current 와 activeNav 가 함께 갱신된다', () => {
            const nav = useSlideOverNav(activeNav as any)
            nav.select(NavKey.DRAW)
            expect(nav.current.value).toBe(NavKey.DRAW)
            expect(activeNav.value).toBe(NavKey.DRAW)
        })

        it('동일 항목을 다시 선택하면 패널을 닫는다 (current=null)', () => {
            const nav = useSlideOverNav(activeNav as any)
            // 초기 current 가 EXPLORE 이므로 EXPLORE 한 번 더 선택 = 토글 닫힘
            nav.select(NavKey.EXPLORE)
            expect(nav.current.value).toBeNull()
        })

        it('AUTH 항목 선택은 activeNav 를 갱신하지 않는다', () => {
            const nav = useSlideOverNav(activeNav as any)
            nav.select(NavKey.AUTH)
            expect(nav.current.value).toBe(NavKey.AUTH)
            expect(activeNav.value).toBe(NavKey.EXPLORE)
        })
    })

    describe('activeNav → current 역방향 동기화', () => {
        it('외부에서 activeNav 를 LIST 로 변경하면 current 도 LIST 로 동기화된다', async () => {
            const nav = useSlideOverNav(activeNav as any)
            nav.select(NavKey.DRAW)
            await nextTick()
            expect(nav.current.value).toBe(NavKey.DRAW)

            activeNav.value = NavKey.LIST
            await nextTick()

            expect(nav.current.value).toBe(NavKey.LIST)
        })

        it('외부에서 activeNav 를 DRAW 로 변경해도 current 가 따라간다', async () => {
            const nav = useSlideOverNav(activeNav as any)
            activeNav.value = NavKey.DRAW
            await nextTick()
            expect(nav.current.value).toBe(NavKey.DRAW)
        })

        it('AUTH 값은 외부 동기화 대상에서 제외된다 (보안: SlideOver 인증 우회 방지)', async () => {
            const nav = useSlideOverNav(activeNav as any)
            const before = nav.current.value
            activeNav.value = NavKey.AUTH
            await nextTick()
            expect(nav.current.value).toBe(before)
        })

        it('current 와 동일한 값으로 activeNav 가 변경되면 무한 루프 없이 안정 상태를 유지한다', async () => {
            const nav = useSlideOverNav(activeNav as any)
            // default EXPLORE 와 다른 값으로 전환해야 select 가 토글 닫힘이 아닌 전환을 트리거한다
            nav.select(NavKey.DRAW)
            expect(activeNav.value).toBe(NavKey.DRAW)
            // 같은 값 재할당 — watcher가 다시 발화하더라도 값은 안정적이어야 한다.
            activeNav.value = NavKey.DRAW
            await nextTick()
            expect(nav.current.value).toBe(NavKey.DRAW)
        })
    })
})
