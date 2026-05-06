import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { NotificationOptions } from '~/entities/notification/model/useNotificationStore'
import { createEntityGroup } from '~/shared/lib/map/useEntityCleanup'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { splitSectionAtPoint, syncSectionAttrs } from '~/entities/route/lib/useRouteDrawDraft'
import {
    cartesianToRouteDrawPosition,
    toCartesianPosition,
    toCesiumColor
} from '~/entities/route/lib/useRouteDrawUtils'
import { createClampedPoint } from '~/entities/route/lib/useGroundClamping'

export interface UseSplitModeSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    drawnPositions: Ref<GeoJsonPosition[] | null>
    sectionPointRanges: Ref<Array<{ start: number; end: number }>>
    sectionDraft: Ref<CreateSectionSchema | null>
    notify: (options: NotificationOptions) => void
    /** Split 결과 반영 후 메인 그리기 그래픽을 재생성하는 콜백 */
    onAfterSplit: () => void
}

/**
 * 구간 포인트 선택/드래그 기반 Split Mode를 담당하는 sideeffect composable.
 * - 클릭: 중간 포인트에서 구간 분할
 * - 드래그: 포인트 좌표 수정
 *
 * `useRouteDrawSideeffect`에서 추출되어 책임을 분리한다.
 */
export const useSplitModeSideeffect = (options: UseSplitModeSideeffectOptions) => {
    const splitMode = ref(false)
    const splitTargetIndex = ref<number | null>(null)
    const splitPointGroup = createEntityGroup(options.viewer)
    const splitPointMap = new Map<CesiumEntity, number>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let splitHandler: any = null

    /** 지정 포인트에서 구간을 분할한다. */
    const handleSplitAtPoint = (sectionIndex: number, pointIndex: number) => {
        if (!options.sectionDraft.value) return

        const nextRanges = splitSectionAtPoint(
            options.sectionPointRanges.value,
            sectionIndex,
            pointIndex
        )

        options.sectionPointRanges.value = nextRanges
        options.sectionDraft.value = {
            ...options.sectionDraft.value,
            attrs: syncSectionAttrs(options.sectionDraft.value.attrs ?? [], nextRanges)
        }

        exitSplitMode()
        options.onAfterSplit()
    }

    /** split mode를 종료하고 포인트 엔티티·핸들러를 정리한다. */
    const exitSplitMode = () => {
        splitMode.value = false
        splitTargetIndex.value = null
        splitPointGroup.clear()
        splitPointMap.clear()
        if (splitHandler) {
            splitHandler.destroy()
            splitHandler = null
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewer = options.viewer.value as any
        if (viewer?.scene?.screenSpaceCameraController) {
            viewer.scene.screenSpaceCameraController.enableRotate = true
        }
    }

    /** 지정 구간의 모든 포인트를 시각화하고 클릭/드래그 핸들러를 설정한다. */
    const enterSplitMode = (sectionIndex: number) => {
        const positions = options.drawnPositions.value
        const range = options.sectionPointRanges.value[sectionIndex]
        if (!positions || !range || !options.viewer.value) return

        exitSplitMode()

        splitMode.value = true
        splitTargetIndex.value = sectionIndex

        const Cesium = getCesiumRuntime()
        const entities: CesiumEntity[] = []

        for (let i = range.start; i <= range.end; i++) {
            const pos = positions[i]
            if (!pos) continue

            const isEndpoint = i === range.start || i === range.end
            const entity = options.viewer.value.entities.add({
                position: toCartesianPosition(Cesium, pos),
                point: createClampedPoint(Cesium, {
                    color: isEndpoint
                        ? toCesiumColor(Cesium, '#888888', 0.5)
                        : toCesiumColor(Cesium, '#00BFFF', 0.9),
                    pixelSize: isEndpoint ? 6 : 8,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }) as any
            }) as CesiumEntity

            splitPointMap.set(entity, i)
            entities.push(entity)
        }

        splitPointGroup.set(entities)

        // 클릭/드래그 이벤트 핸들러
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewer = options.viewer.value as any
        splitHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

        let dragEntity: CesiumEntity | null = null
        let dragPointIndex: number | null = null

        const pickSplitEntity = (pos: unknown): CesiumEntity | null => {
            const picked = viewer.scene.pick(pos)
            const entity = picked?.id as CesiumEntity | undefined
            return entity && splitPointMap.has(entity) ? entity : null
        }

        // LEFT_CLICK → 클릭한 포인트에서 구간 분할
        splitHandler!.setInputAction((movement: { position?: unknown }) => {
            const entity = pickSplitEntity(movement.position)
            if (!entity) return

            const pointIndex = splitPointMap.get(entity)!
            const r = options.sectionPointRanges.value[sectionIndex]
            if (!r || pointIndex <= r.start || pointIndex >= r.end) {
                options.notify({
                    title: '구간 나누기 불가',
                    message:
                        '구간의 시작/끝 포인트에서는 나눌 수 없습니다. 중간 포인트를 선택하세요.',
                    tone: NotificationToneEnum.WARNING
                })
                return
            }
            handleSplitAtPoint(sectionIndex, pointIndex)
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

        // LEFT_DOWN → 드래그 시작
        splitHandler!.setInputAction((movement: { position?: unknown }) => {
            const entity = pickSplitEntity(movement.position)
            if (!entity) return

            dragEntity = entity
            dragPointIndex = splitPointMap.get(entity)!
            if (viewer.scene.screenSpaceCameraController) {
                viewer.scene.screenSpaceCameraController.enableRotate = false
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

        // MOUSE_MOVE → 드래그 중 위치 갱신 (시각적)
        splitHandler!.setInputAction((movement: { endPosition?: unknown }) => {
            if (!dragEntity || dragPointIndex === null) return

            const cartesian =
                viewer.scene.pickPosition?.(movement.endPosition) ??
                viewer.camera.pickEllipsoid?.(movement.endPosition, Cesium.Ellipsoid.WGS84)
            if (!cartesian) return // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(dragEntity as any).position = cartesian
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

        // LEFT_UP → 드래그 종료, 좌표 반영
        splitHandler!.setInputAction(() => {
            if (!dragEntity || dragPointIndex === null || !options.drawnPositions.value) {
                dragEntity = null
                dragPointIndex = null
                return
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pos = (dragEntity as any).position
            const cartesian = typeof pos?.getValue === 'function' ? pos.getValue(0) : pos
            if (cartesian) {
                const newPos = cartesianToRouteDrawPosition(Cesium, cartesian)
                const updated = [...options.drawnPositions.value]
                updated[dragPointIndex] = newPos
                options.drawnPositions.value = updated
            }

            if (viewer.scene.screenSpaceCameraController) {
                viewer.scene.screenSpaceCameraController.enableRotate = true
            }
            dragEntity = null
            dragPointIndex = null

            options.onAfterSplit()
            enterSplitMode(sectionIndex)
        }, Cesium.ScreenSpaceEventType.LEFT_UP)
    }

    return {
        splitMode,
        enterSplitMode,
        exitSplitMode
    }
}
