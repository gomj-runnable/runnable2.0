import type { RouteDraftInput, RouteSectionDraftInput } from '#shared/types/route'

/**
 * 경로 저장 API 호출을 담당하는 sideeffect composable.
 * `section`의 `routeId`(draft 값)는 서버에서 실제 ID로 대체되므로 전송 시 제외한다.
 */
export const useRouteSaveSideeffect = () => {
    const saveRoute = (route: RouteDraftInput, sections: RouteSectionDraftInput[]) =>
        $fetch('/api/routes', {
            method: 'POST',
            body: {
                route,
                sections: sections.map((section) => ({ geom: section.geom, attrs: section.attrs }))
            }
        })

    return { saveRoute }
}
