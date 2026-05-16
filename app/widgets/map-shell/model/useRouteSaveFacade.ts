import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useRouteSaveSideeffect } from '~/features/draw-route/api/useRouteSaveSideeffect'
import type { useRouteListSideeffect } from '~/features/draw-route/api/useRouteListSideeffect'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { buildRouteSavePayload } from '~/entities/route/lib/useRouteSaveBuilder'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

interface RouteSaveFacadeOptions {
    onAfterSave?: (routeId: string) => Promise<void>
}

/**
 * 경로 저장 모달 열기·확정 저장 기능을 제공하는 sub-facade.
 */
export const useRouteSaveFacade = (
    listEffect: ReturnType<typeof useRouteListSideeffect>,
    options?: RouteSaveFacadeOptions
) => {
    const store = useRouteDrawStore()
    const notification = useNotificationStore()
    const authStore = useAuthStore()
    const saveEffect = useRouteSaveSideeffect()

    const buildSavePayload = () =>
        buildRouteSavePayload({
            sectionDraft: store.sectionDraft.value,
            drawnPositions: store.drawnPositions.value,
            closingMode: store.closingMode.value,
            sectionPointRanges: store.sectionPointRanges.value,
            drawMetrics: store.drawMetrics.value,
            routeForm: store.routeForm.value,
            sectionPois: store.sectionPois.value
        })

    const confirmSave = async () => {
        if (!authStore.isLoggedIn.value) {
            store.isRouteSaveModalOpen.value = false
            authStore.openLoginModal()
            notification.notify({
                title: '로그인 필요',
                message: '경로를 저장하려면 먼저 로그인해주세요.',
                tone: NotificationToneEnum.INFO
            })
            return
        }

        try {
            const { routeDraftPayload, sectionPayloads } = buildSavePayload()
            const editId = store.editingRouteId.value

            if (editId) {
                await saveEffect.updateRoute(editId, routeDraftPayload, sectionPayloads)
            } else {
                const saveResult = (await saveEffect.saveRoute(
                    routeDraftPayload,
                    sectionPayloads
                )) as {
                    route: { routeId: string }
                }
                await options?.onAfterSave?.(saveResult.route.routeId)
            }

            await listEffect.fetchRoutes()

            store.isRouteSaveModalOpen.value = false
            store.resetRouteDrawState()
            store.activeNav.value = '목록'
            notification.notify({
                title: editId ? '수정 완료' : '저장 완료',
                message: editId ? '경로가 수정되었습니다.' : '경로가 저장되었습니다.',
                tone: NotificationToneEnum.SUCCESS
            })
        } catch (error) {
            notification.notify({
                title: '저장 실패',
                message: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

    const saveModal = reactive({
        open: store.isRouteSaveModalOpen,
        routeForm: store.routeForm,
        routeDistance: store.routeDistance,
        editingRouteId: store.editingRouteId,
        confirm: confirmSave
    })

    return { saveModal, confirmSave }
}
