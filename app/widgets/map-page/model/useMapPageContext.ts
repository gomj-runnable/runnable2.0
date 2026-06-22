import type { InjectionKey } from 'vue'
import type { NavKeyValue } from './nav-key'
import type { useRouteMapFacade } from './useRouteMapFacade'
import type { useRouteSelectionFlow } from './useRouteSelectionFlow'
import type { useSlideOverNav } from './useSlideOverNav'
import type { useAuthStore } from '~/entities/user/model/useAuthStore'

/**
 * 지도 페이지(부모 layout)가 자식 탭 panel 라우트에 내려주는 공유 컨텍스트.
 *
 * nested route(`pages/index/*`)로 분리된 panel(목록·그리기·탐색)은 부모가 1회 생성한
 * facade·flow·auth·네비게이션 핸들을 직접 받지 못하므로, 이 컨텍스트로 provide/inject 한다.
 * (대부분 상태가 `useState` 전역이지만 facade·flow 는 페이지 로컬이라 주입이 필요하다.)
 */
export interface MapPageContext {
    facade: ReturnType<typeof useRouteMapFacade>
    flow: ReturnType<typeof useRouteSelectionFlow>
    slideOver: ReturnType<typeof useSlideOverNav>
    authStore: ReturnType<typeof useAuthStore>
    /** Nav Rail 선택 핸들러 (목록·그리기는 path 이동, 로그인은 SlideOver 토글). */
    selectNav: (_nav: NavKeyValue) => void
    /** 경로 목록을 다시 불러온다 (로그인 직후 등). */
    fetchRoutes: () => Promise<void> | void
}

export const MAP_PAGE_CONTEXT: InjectionKey<MapPageContext> = Symbol('map-page-context')

/**
 * 부모 지도 페이지가 provide 한 컨텍스트를 자식 panel 라우트에서 주입받는다.
 * @throws 부모 layout 밖에서 호출 시 에러
 */
export const useMapPageContext = (): MapPageContext => {
    const ctx = inject(MAP_PAGE_CONTEXT)
    if (!ctx) {
        throw new Error(
            '[useMapPageContext] 부모 지도 페이지(pages/index.vue) 밖에서 호출되었습니다.'
        )
    }
    return ctx
}
