import type { ShallowRef } from 'vue'
import type { SavedRouteInfo, RouteInfoDraftInput } from '#shared/types/routeInfo'
import type { CesiumViewer, CesiumEntity } from '~/shared/lib/useWindow'
import { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import type { CesiumDrawHandler } from '#shared/types/cesium'

export interface RouteInfoClickedPosition {
    lng: number
    lat: number
    elevation?: number
}

/**
 * 경로정보 데이터 페칭, Cesium 마커 렌더링, 지도 클릭 핸들링을 담당하는 sideeffect.
 * 서버 저장된 경로정보와 로컬 미저장 경로정보 모두 지도에 표시한다.
 */
export const useRouteInfoSideeffect = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useRouteInfoStore()
    let entityGroup: ReturnType<typeof createEntityGroup> | null = null
    const entityToRouteInfoMap = new Map<CesiumEntity, SavedRouteInfo | RouteInfoDraftInput>()

    /** 지도 클릭으로 선택된 경로정보 위치 */
    const clickedPosition = ref<RouteInfoClickedPosition | null>(null)
    let addClickHandler: CesiumDrawHandler | null = null
    let markerClickHandler: CesiumDrawHandler | null = null

    // ─── 지도 클릭: 경로정보 추가 모드 ─────────────────────────────

    watch(
        () => store.isAddingRouteInfo.value,
        (isAdding) => {
            addClickHandler?.destroy()
            addClickHandler = null
            clickedPosition.value = null

            if (!isAdding) return

            const v = viewer.value
            if (!v) return

            const C = getCesiumRuntime()
            const handler = new C.ScreenSpaceEventHandler(v.scene.canvas)

            handler.setInputAction((movement: { position?: unknown }) => {
                const scene = (v as unknown as { scene: import('cesium').Scene }).scene
                let cartesian: import('cesium').Cartesian3 | undefined

                if (scene.pickPositionSupported) {
                    const picked = scene.pickPosition(
                        movement.position as import('cesium').Cartesian2
                    )
                    if (C.defined(picked)) cartesian = picked
                }

                if (!cartesian) {
                    const ray = (
                        v as unknown as { camera: import('cesium').Camera }
                    ).camera.getPickRay(movement.position as import('cesium').Cartesian2)
                    if (ray) {
                        const globePick = scene.globe?.pick(ray, scene)
                        if (C.defined(globePick)) cartesian = globePick
                    }
                }

                if (!cartesian) return

                const carto = C.Cartographic.fromCartesian(cartesian)
                clickedPosition.value = {
                    lng: C.Math.toDegrees(carto.longitude),
                    lat: C.Math.toDegrees(carto.latitude),
                    elevation: carto.height > 0 ? carto.height : undefined
                }
            }, C.ScreenSpaceEventType.LEFT_CLICK)

            addClickHandler = handler
        }
    )

    const cancelAdding = () => {
        store.isAddingRouteInfo.value = false
        clickedPosition.value = null
    }

    // ─── 마커 클릭: 팝업 표시 ────────────────────────────────────

    watch(
        viewer,
        (v) => {
            markerClickHandler?.destroy()
            markerClickHandler = null

            if (!v) return

            const C = getCesiumRuntime()
            const handler = new C.ScreenSpaceEventHandler(v.scene.canvas)

            handler.setInputAction((movement: { position?: unknown }) => {
                if (store.isAddingRouteInfo.value) return

                const picked = v.scene.pick(movement.position as import('cesium').Cartesian2)
                if (!picked?.id) {
                    store.selectedMarkerRouteInfo.value = null
                    return
                }

                const item = entityToRouteInfoMap.get(picked.id as CesiumEntity)
                if (item) {
                    store.selectedMarkerRouteInfo.value = item
                } else {
                    store.selectedMarkerRouteInfo.value = null
                }
            }, C.ScreenSpaceEventType.LEFT_CLICK)

            markerClickHandler = handler
        },
        { immediate: true }
    )

    // ─── 서버 API ────────────────────────────────────────────────

    const fetchRouteInfos = async (routeId: string) => {
        store.isLoading.value = true
        try {
            const data = await $fetch<SavedRouteInfo[]>(`/api/routes/${routeId}/feedbacks`)
            store.routeInfos.value = data
        } catch (e) {
            console.error('[RouteInfoSideeffect] 경로정보 조회 실패:', e)
        } finally {
            store.isLoading.value = false
        }
    }

    /** 로컬 경로정보를 서버에 일괄 저장한다 */
    const saveLocalRouteInfos = async (routeId: string) => {
        const locals = store.localRouteInfos.value
        if (!locals.length) return

        for (const input of locals) {
            try {
                const item = await $fetch<SavedRouteInfo>(`/api/routes/${routeId}/feedbacks`, {
                    method: 'POST',
                    body: input
                })
                store.routeInfos.value = [...store.routeInfos.value, item]
            } catch (e) {
                console.error('[RouteInfoSideeffect] 경로정보 일괄 저장 실패:', e)
            }
        }
        store.clearLocalRouteInfos()
    }

    /** 새 경로정보를 서버에 즉시 전송한다 (저장된 경로에서 ChipButton으로 추가 시) */
    const submitRouteInfo = async (routeId: string, input: RouteInfoDraftInput) => {
        try {
            const item = await $fetch<SavedRouteInfo>(`/api/routes/${routeId}/feedbacks`, {
                method: 'POST',
                body: input
            })
            store.routeInfos.value = [...store.routeInfos.value, item]
            store.isAddingRouteInfo.value = false
            return item
        } catch (e) {
            console.error('[RouteInfoSideeffect] 경로정보 등록 실패:', e)
            throw e
        }
    }

    // ─── 마커 렌더링 ─────────────────────────────────────────────

    const renderRouteInfoMarkers = () => {
        const v = viewer.value
        if (!v) return

        const C = getCesiumRuntime()
        clearMarkers()
        entityGroup = createEntityGroup(v)
        entityToRouteInfoMap.clear()

        const allItems: (SavedRouteInfo | RouteInfoDraftInput)[] = [
            ...store.routeInfos.value,
            ...store.localRouteInfos.value
        ]

        for (const item of allItems) {
            const position = C.Cartesian3.fromDegrees(
                Number(item.lng),
                Number(item.lat),
                item.elevation != null ? Number(item.elevation) + 2 : undefined
            )

            const entity = entityGroup.add({
                position,
                point: {
                    pixelSize: 10,
                    color: C.Color.YELLOW,
                    outlineColor: C.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: C.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: item.name,
                    font: '13px sans-serif',
                    style: C.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    outlineColor: C.Color.BLACK,
                    fillColor: C.Color.WHITE,
                    verticalOrigin: C.VerticalOrigin.BOTTOM,
                    pixelOffset: new C.Cartesian2(0, -12),
                    heightReference: C.HeightReference.CLAMP_TO_GROUND,
                    showBackground: true,
                    backgroundColor: new C.Color(0.165, 0.165, 0.165, 0.8)
                },
                properties: {
                    type: 'routeInfo'
                }
            })

            entityToRouteInfoMap.set(entity, item)
        }
    }

    const clearMarkers = () => {
        if (entityGroup) {
            entityGroup.removeAll()
            entityGroup = null
        }
        entityToRouteInfoMap.clear()
    }

    // 경로정보 목록 또는 로컬 경로정보 변경 시 마커 재렌더링
    watch(
        [() => store.routeInfos.value, () => store.localRouteInfos.value],
        () => renderRouteInfoMarkers(),
        { deep: true }
    )

    return {
        fetchRouteInfos,
        submitRouteInfo,
        saveLocalRouteInfos,
        renderRouteInfoMarkers,
        clearMarkers,
        clickedPosition,
        cancelAdding
    }
}

/** Cesium entity 그룹을 생성하여 일괄 관리한다 */
function createEntityGroup(viewer: CesiumViewer) {
    const entities: CesiumEntity[] = []

    return {
        add(options: Record<string, unknown>) {
            const entity = viewer.entities.add(options)
            entities.push(entity)
            return entity
        },
        removeAll() {
            for (const entity of entities) {
                viewer.entities.remove(entity)
            }
            entities.length = 0
        }
    }
}
