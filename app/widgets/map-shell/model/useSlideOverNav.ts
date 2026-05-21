import { NavKey, type NavKeyValue } from './nav-key'
import { useAuthStore } from '~/entities/user/model/useAuthStore'

/**
 * SlideOver 네비게이션 상태를 관리하는 composable.
 *
 * Nav Rail 클릭 → SlideOver 열림/닫힘을 제어하고,
 * 외부에서 authStore.openLoginModal() 호출 시 SlideOver로 리다이렉트한다.
 *
 * @param activeNav - useRouteMapFacade가 소유하는 활성 탭 ref (그리기·목록·탐색 전환 시 동기)
 */
export const useSlideOverNav = (activeNav: Ref<string>) => {
    const authStore = useAuthStore()

    /** 현재 SlideOver에 표시 중인 네비게이션 (null이면 닫힘). 진입 기본: EXPLORE */
    const current = ref<NavKeyValue | null>(NavKey.EXPLORE)

    const isOpen = computed({
        get: () => current.value !== null,
        set: (v: boolean) => {
            if (!v) current.value = null
        }
    })

    /** Nav Rail 항목 클릭 핸들러. 같은 항목이면 닫고, 다른 항목이면 전환. */
    const select = (nav: NavKeyValue) => {
        if (current.value === nav) {
            current.value = null
        } else {
            current.value = nav
            if (nav !== NavKey.AUTH) activeNav.value = nav
        }
    }

    /** SlideOver 헤더에 표시할 제목·설명 */
    const meta = computed(() => {
        switch (current.value) {
            case NavKey.LIST:
                return { title: '경로 목록', description: '저장된 러닝 경로를 관리합니다' }
            case NavKey.DRAW:
                return { title: '경로 그리기', description: '새로운 러닝 경로를 제작합니다' }
            case NavKey.EXPLORE:
                return { title: '경로 탐색', description: '공개된 경로를 탐색합니다' }
            case NavKey.AUTH:
                return {
                    title: authStore.isLoggedIn.value ? '내 계정' : '로그인',
                    description: authStore.isLoggedIn.value
                        ? '계정 설정을 관리합니다'
                        : '계정에 로그인하세요'
                }
            default:
                return { title: '', description: '' }
        }
    })

    /** SlideOver를 닫는다. */
    const close = () => {
        current.value = null
    }

    // ─── authStore 브릿지 ───────────────────────────────────────
    // useRouteMapFacade 등 외부에서 authStore.openLoginModal()을 호출하면
    // SlideOver 인증 탭으로 리다이렉트한다.
    watch(
        () => authStore.isAuthModalOpen.value,
        (open) => {
            if (open) {
                current.value = NavKey.AUTH
                authStore.closeAuthModal()
            }
        }
    )

    // ─── activeNav → current 역방향 동기화 ─────────────────────
    // confirmSave 등 외부 코드가 activeNav를 직접 바꾼 경우에도 SlideOver 패널이 따라 바뀌도록 한다.
    watch(activeNav, (nav) => {
        if (
            nav !== current.value &&
            (nav === NavKey.LIST || nav === NavKey.DRAW || nav === NavKey.EXPLORE)
        ) {
            current.value = nav
        }
    })

    /** 마지막으로 선택된 네비게이션 (닫혀도 active 표시용) */
    const lastActive = computed(() => current.value ?? _lastNav.value)
    const _lastNav = ref<NavKeyValue>(NavKey.EXPLORE)
    watch(current, (nav) => {
        if (nav) _lastNav.value = nav
    })

    return { current, isOpen, meta, select, close, lastActive }
}
