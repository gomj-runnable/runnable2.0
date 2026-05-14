import { useRouteDownloadSideeffect } from '~/features/draw-route/api/useRouteDownloadSideeffect'

/**
 * 경로 파일 다운로드 sideeffect를 단일 책임 단위로 노출하는 facade.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 */
export const useRouteDownloadFacade = () => {
    const effect = useRouteDownloadSideeffect()
    return {
        downloadTextFile: effect.downloadTextFile
    }
}
