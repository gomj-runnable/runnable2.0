import type { RouteDraftInput, RouteSectionDraftInput } from '#shared/types/route'

/**
 * 경로 저장 API 호출을 담당하는 sideeffect composable.
 * `section`의 `routeId`(draft 값)는 서버에서 실제 ID로 대체되므로 전송 시 제외한다.
 */
export const useRouteSaveSideeffect = () => {
    /**
     * 경로와 구간 목록을 서버에 저장한다.
     * `section.routeId`(draft 값)는 전송 시 제외하며, 서버에서 실제 ID를 부여한다.
     *
     * @param route - 저장할 경로 초안 데이터
     * @param sections - 저장할 구간 초안 배열
     */
    const saveRoute = (route: RouteDraftInput, sections: RouteSectionDraftInput[]) =>
        $fetch('/api/routes', {
            method: 'POST',
            body: {
                route,
                sections: sections.map((section) => ({
                    geom: section.geom,
                    attrs: section.attrs,
                    pois: section.pois
                }))
            }
        })

    /**
     * 기존 경로와 구간을 업데이트한다.
     * 서버에서 기존 구간을 삭제하고 새 구간으로 교체한다.
     */
    const updateRoute = (
        routeId: string,
        route: RouteDraftInput,
        sections: RouteSectionDraftInput[]
    ) =>
        $fetch(`/api/routes/${routeId}`, {
            method: 'PUT',
            body: {
                route,
                sections: sections.map((section) => ({
                    geom: section.geom,
                    attrs: section.attrs,
                    pois: section.pois
                }))
            }
        })

    return { saveRoute, updateRoute }
}
