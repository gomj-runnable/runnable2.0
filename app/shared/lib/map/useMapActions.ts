import { shallowRef } from 'vue'

/** 경로 ID(+선택적 제목)를 받는 맵 액션 시그니처. */
type RouteAction = (routeId: string) => void | Promise<void>

// 전역 단일 맵 액션 참조. index.vue(코어)가 facade 조립 후 register 한다.
// 플러그인(탐색 사이드패널 등)은 viewer/sectionInfo 등 코어 의존성에 직접 접근하지 않고
// 이 전역 액션을 통해 경로 선택/가져오기를 호출한다. (useMapViewer 패턴과 동일)
const selectRouteRef = shallowRef<RouteAction | null>(null)
const importRouteRef = shallowRef<RouteAction | null>(null)

/** 코어·플러그인 공용 맵 액션 접근. 코어가 register, 플러그인이 호출한다. */
export function useMapActions() {
    /** 코어(index.vue)에서 facade로 조립한 탐색 액션을 전역에 등록한다. */
    const registerExploreActions = (actions: {
        selectRoute: RouteAction
        importRoute: RouteAction
    }) => {
        selectRouteRef.value = actions.selectRoute
        importRouteRef.value = actions.importRoute
    }

    /** 탐색 결과 경로 선택 — 등록 전이면 no-op. */
    const exploreSelectRoute: RouteAction = (routeId) => selectRouteRef.value?.(routeId)
    /** 탐색 결과 경로 가져오기(fork) — 등록 전이면 no-op. */
    const exploreImportRoute: RouteAction = (routeId) => importRouteRef.value?.(routeId)

    return { registerExploreActions, exploreSelectRoute, exploreImportRoute }
}
