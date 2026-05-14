import { useRouteSaveSideeffect } from '~/features/draw-route/api/useRouteSaveSideeffect'

/**
 * 경로 저장(신규/수정) sideeffect를 단일 책임 단위로 노출하는 facade.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 * 호출처는 #127 Phase 2에서 이관한다.
 */
export const useRouteSaveFacade = () => {
    const effect = useRouteSaveSideeffect()
    return {
        saveRoute: effect.saveRoute,
        updateRoute: effect.updateRoute
    }
}
