import type { Ref } from 'vue'
import { NavKey, type NavKeyValue } from './nav-key'
import type { useSlideOverNav } from './useSlideOverNav'
import { usePluginSurfaces } from '~/plugins-ext/usePluginSurfaces'

/** 탭 키. nested route path(`/`·`/draw`·`/explore`)에 1:1 대응한다. */
export const TabKey = {
    LIST: 'list',
    DRAW: 'draw',
    EXPLORE: 'explore'
} as const

export type TabKeyValue = (typeof TabKey)[keyof typeof TabKey]

/** 탐색 탭에 대응하는 activeNav 값 (NavKey에 없는 플러그인 탭이라 raw string 사용). */
const EXPLORE_NAV = '탐색'
/** 탐색 사이드패널 플러그인 id (plugin.manifest.ts와 일치). */
const EXPLORE_PLUGIN_ID = 'explore'

const NAV_BY_TAB: Record<TabKeyValue, string> = {
    [TabKey.LIST]: NavKey.LIST,
    [TabKey.DRAW]: NavKey.DRAW,
    [TabKey.EXPLORE]: EXPLORE_NAV
}

/** 탭 → URL path. 목록은 루트(`/`). */
const PATH_BY_TAB: Record<TabKeyValue, string> = {
    [TabKey.LIST]: '/',
    [TabKey.DRAW]: '/draw',
    [TabKey.EXPLORE]: '/explore'
}

/** URL path → 탭. 미지원 path 는 LIST 로 폴백. */
const tabByPath = (path: string): TabKeyValue => {
    if (path === PATH_BY_TAB[TabKey.DRAW]) return TabKey.DRAW
    if (path === PATH_BY_TAB[TabKey.EXPLORE]) return TabKey.EXPLORE
    return TabKey.LIST
}

interface UseTabRouteOptions {
    /** facade가 소유하는 활성 탭 ref */
    activeNav: Ref<string>
    /** 좌측 SlideOver(목록·그리기) 제어 핸들 */
    slideOver: ReturnType<typeof useSlideOverNav>
}

/**
 * nested route path(`/`·`/draw`·`/explore`)를 탭 mode·상태값의 단일 진실 소스로 삼는 composable.
 *
 * - 탭 선택 → path 이동 (`setTab` → router.push)
 * - path 변경(딥링크·뒤로가기) → 좌측 SlideOver / 탐색 플러그인 패널 동기화 (`applyTab`)
 *
 * 목록·그리기는 `activeNav`+좌측 SlideOver, 탐색은 우측 플러그인 패널로 분리돼 있어
 * 이 composable이 두 시스템을 path 한 곳으로 묶는다.
 */
export const useTabRoute = ({ activeNav, slideOver }: UseTabRouteOptions) => {
    const route = useRoute()
    const router = useRouter()
    const surfaces = usePluginSurfaces()

    /** 현재 path 가 가리키는 탭. */
    const currentTab = computed<TabKeyValue>(() => tabByPath(route.path))

    /** 탭 선택 → path 이동. 실제 상태 변경은 path watcher(`applyTab`)가 담당한다. */
    const setTab = (tab: TabKeyValue) => {
        const path = PATH_BY_TAB[tab]
        if (route.path !== path) router.push(path)
    }

    /** path 탭 값 → mode·상태값 동기화. */
    const applyTab = (tab: TabKeyValue) => {
        if (tab === TabKey.EXPLORE) {
            activeNav.value = EXPLORE_NAV
            slideOver.close() // 좌측 패널을 닫고 우측 탐색 패널만 노출
            surfaces.open(EXPLORE_PLUGIN_ID)
            return
        }

        if (surfaces.activeId.value === EXPLORE_PLUGIN_ID) surfaces.close()
        const nav = NAV_BY_TAB[tab] as NavKeyValue
        activeNav.value = nav // facade(드로잉 시작·정리) 구동
        slideOver.current.value = nav // 좌측 패널을 결정적으로 연다
    }

    // path 변경(딥링크·뒤로가기) → 상태 반영
    watch(currentTab, applyTab)

    // 런처로 탐색 패널을 열면 path도 따라가도록 브릿지 (탐색 외 플러그인은 무시)
    watch(surfaces.activeId, (id) => {
        if (id === EXPLORE_PLUGIN_ID) setTab(TabKey.EXPLORE)
    })

    // 최초 진입(딥링크 포함) 시 path 탭을 상태에 적용
    onMounted(() => applyTab(currentTab.value))

    return { currentTab, setTab }
}
