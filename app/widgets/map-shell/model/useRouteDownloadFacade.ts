import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useRouteDownloadSideeffect } from '~/features/draw-route/api/useRouteDownloadSideeffect'
import type { useRouteListSideeffect } from '~/features/draw-route/api/useRouteListSideeffect'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { createRouteGpx, toGpxFileName } from '~/entities/route/lib/useRouteGpx'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

/**
 * 경로 GPX 다운로드 기능을 제공하는 sub-facade.
 */
export const useRouteDownloadFacade = (listEffect: ReturnType<typeof useRouteListSideeffect>) => {
    const store = useRouteDrawStore()
    const notification = useNotificationStore()
    const downloadEffect = useRouteDownloadSideeffect()

    const downloadRouteGpx = async (routeId: string) => {
        try {
            const route = store.routes.value.find((item) => item.routeId === routeId)

            if (!route) {
                throw new Error('경로 정보를 찾을 수 없습니다.')
            }

            const sections = await listEffect.fetchRouteSections(routeId)

            if (!sections.length) {
                throw new Error('다운로드할 경로 구간이 없습니다.')
            }

            downloadEffect.downloadTextFile(
                toGpxFileName(route.title),
                createRouteGpx(route, sections),
                'application/gpx+xml;charset=utf-8'
            )
            notification.notify({
                title: '다운로드 준비 완료',
                message: `${route.title} GPX 다운로드를 시작했습니다.`,
                tone: NotificationToneEnum.SUCCESS
            })
        } catch (error) {
            notification.notify({
                title: '다운로드 실패',
                message:
                    error instanceof Error ? error.message : 'GPX 다운로드 중 오류가 발생했습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

    return { downloadRouteGpx }
}
