import type { Ref, ShallowRef } from 'vue'
import type { DrawActionData, CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'
import { createEntityGroup } from '~/shared/lib/map/useEntityCleanup'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import { createSectionSchema } from '#shared/schemas/route.schema'
import {
    createHeightAwareRouteGeom,
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    mergeSectionPointRanges,
    removeSectionDraftAttr,
    syncSectionAttrs,
    updateSectionDraftAttr
} from '~/entities/route/lib/useRouteDrawDraft'
import {
    addRoutePointEntity,
    getSectionColor,
    normalizeDrawPositions,
    toCesiumColor
} from '~/entities/route/lib/useRouteDrawUtils'
import { createClampedPolyline } from '~/entities/route/lib/useGroundClamping'
import { useSplitModeSideeffect } from './useSplitModeSideeffect'
import { SECTION_START_MARKER_COLOR } from '#shared/constants/route'
import type { NotificationOptions } from '~/entities/notification/model/useNotificationStore'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

/**
 * `useRouteDrawSideeffect`에 주입하는 의존성 옵션.
 * store의 ref들을 직접 전달받아 사이드이펙트 결과를 store에 반영한다.
 */
interface UseRouteDrawSideeffectOptions {
    /** 초기화된 Cesium 뷰어 인스턴스 ref. 뷰어가 준비되지 않은 경우 `null`. */
    viewer: ShallowRef<CesiumViewer | null>
    /** 드로잉 완료 후 저장할 경도/위도/고도 포인트 배열 ref */
    drawnPositions: Ref<GeoJsonPosition[] | null>
    /** 드로잉 완료 후 저장할 측정값 ref */
    drawMetrics: Ref<DrawActionData | null>
    /** 구간 초안 ref */
    sectionDraft: Ref<CreateSectionSchema | null>
    /** 구간별 포인트 인덱스 범위 배열 ref */
    sectionPointRanges: Ref<Array<{ start: number; end: number }>>
    /** 저장 모달 개폐 상태 ref */
    isRouteSaveModalOpen: Ref<boolean>
    /** 드로잉 관련 상태 전체를 초기화하는 함수 */
    resetRouteDrawState: () => void
    /** 경로 닫기 모드 ref */
    closingMode?: Ref<RouteClosingModeEnum | null>
    /** 알림 표시 콜백. alert() 대신 모달로 메시지를 표시한다. */
    notify: (options: NotificationOptions) => void
}

/**
 * 경로 드로잉과 구간 그래픽 렌더링을 담당하는 sideeffect composable.
 * Cesium 뷰어 API를 직접 호출하여 폴리라인·포인트를 지도에 그리고,
 * 드로잉 이벤트(리셋·저장·구간 수정·구간 삭제)를 처리한다.
 * 상태 반영은 주입받은 `options`의 ref를 통해 store에 위임한다.
 *
 * @param options - store ref와 초기화 함수를 담은 의존성 옵션
 */
const useRouteDrawSideeffect = (options: UseRouteDrawSideeffectOptions) => {
    /** 현재 드로잉이 진행 중인지 여부 (모바일 "완료" 버튼 표시에 사용) */
    const isDrawingActive = ref(false)

    /** 현재 지도에 그려진 구간 폴리라인 엔티티 목록 */
    const sectionPolylines = createEntityGroup(options.viewer)

    /** 현재 지도에 그려진 구간 경계 포인트 엔티티 목록 */
    const sectionPoints = createEntityGroup(options.viewer)

    // ─── Split Mode (구간 포인트 선택/드래그) ───────────────────────
    const { splitMode, enterSplitMode, exitSplitMode } = useSplitModeSideeffect({
        viewer: options.viewer,
        drawnPositions: options.drawnPositions,
        sectionPointRanges: options.sectionPointRanges,
        sectionDraft: options.sectionDraft,
        notify: options.notify,
        onAfterSplit: () => redrawSectionGraphics()
    })

    /**
     * 단일 구간의 폴리라인을 지도에 그린다.
     * 포인트가 2개 미만이거나 뷰어가 없으면 `null`을 반환한다.
     *
     * @param positions - 구간에 포함될 3D 포인트 배열
     * @param sectionIndex - 구간 순서 인덱스 (색상 선택에 사용)
     * @returns 생성된 폴리라인 엔티티, 뷰어 미준비 시 `null`
     */
    const drawSection = (
        positions: GeoJsonPosition[],
        sectionIndex: number,
        isDashed = false
    ): CesiumEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        const color = getSectionColor(sectionIndex)
        const Cesium = getCesiumRuntime()
        const material = isDashed
            ? new Cesium.PolylineDashMaterialProperty({
                  color: toCesiumColor(Cesium, color, 0.7),
                  dashLength: 16
              })
            : toCesiumColor(Cesium, color, 0.95)

        return options.viewer.value.entities.add({
            polyline: createClampedPolyline(Cesium, {
                positions,
                width: 4,
                material
            })
        })
    }

    const createRoutePoint = (position: GeoJsonPosition, color: string): CesiumEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        return addRoutePointEntity(getCesiumRuntime(), options.viewer.value, position, color)
    }

    /**
     * 현재 지도에 그려진 모든 구간 폴리라인과 포인트 마커를 제거한다.
     * 새 드로잉 시작 또는 상태 리셋 전에 호출한다.
     */
    const clearSectionGraphics = () => {
        sectionPolylines.clear()
        sectionPoints.clear()
    }

    /**
     * `sectionPointRanges`를 기준으로 지도의 구간 그래픽을 전체 다시 그린다.
     * 구간 추가·삭제·드로잉 완료 후 항상 호출하여 지도와 상태를 동기화한다.
     * 내부적으로 기존 그래픽을 먼저 제거한 뒤 새로 그린다.
     */
    const redrawSectionGraphics = () => {
        const positions = Array.isArray(options.drawnPositions.value)
            ? options.drawnPositions.value
            : []
        const ranges = options.sectionPointRanges.value

        clearSectionGraphics()

        if (!options.viewer.value || positions.length < 2 || ranges.length === 0) {
            return
        }

        const isRoundTrip = options.closingMode?.value?.isRoundTrip

        sectionPolylines.set(
            ranges
                .map((range, index) => {
                    const sectionPoints = positions.slice(range.start, range.end + 1)

                    return sectionPoints.length >= 2
                        ? drawSection(sectionPoints, index, isRoundTrip)
                        : null
                })
                .filter((entity): entity is CesiumEntity => entity !== null)
        )

        const routePointEntities: CesiumEntity[] = []
        const firstPoint = positions[0]

        if (firstPoint) {
            const startPointEntity = createRoutePoint(firstPoint, SECTION_START_MARKER_COLOR)

            if (startPointEntity) {
                routePointEntities.push(startPointEntity)
            }
        }

        ranges.forEach((range, index) => {
            const endPoint = positions[range.end]

            if (!endPoint) {
                return
            }

            const pointEntity = createRoutePoint(endPoint, getSectionColor(index))

            if (pointEntity) {
                routePointEntities.push(pointEntity)
            }
        })

        sectionPoints.set(routePointEntities)
    }

    /**
     * 드로잉을 초기화하고 새 경로 드로잉을 시작한다.
     * 기존 그래픽과 상태를 모두 제거한 뒤 Cesium `_drawAction` helper를 실행한다.
     * 드로잉 완료 시 store의 포인트·측정값·구간 초안을 갱신하고 구간 그래픽을 다시 그린다.
     * "그리기" 버튼 클릭 이벤트에 연결한다.
     */
    const handleDrawReset = async (): Promise<GeoJsonPosition[] | null> => {
        if (!options.viewer.value) {
            options.notify({
                title: '지도 로딩 중',
                message: '지도를 아직 불러오는 중입니다.',
                tone: NotificationToneEnum.WARNING
            })
            return null
        }

        clearSectionGraphics()
        options.resetRouteDrawState()

        isDrawingActive.value = true

        options.notify({ title: '경로 그리기', message: '좌클릭: 구간 추가\n우클릭: 완료' })

        const result = await options.viewer.value._drawAction({
            shapeType: 1,
            showLabel: true
        })

        isDrawingActive.value = false

        if (!result || !('data' in result) || !result.data) {
            if (result && 'message' in result && result.message) {
                options.notify({
                    title: '알림',
                    message: result.message,
                    tone: NotificationToneEnum.WARNING
                })
            }
            return null
        }
        const data = result.data
        const positions = normalizeDrawPositions(getCesiumRuntime(), data)
        const routeGeom = createHeightAwareRouteGeom(data, positions)

        if (positions.length === 0) {
            return null
        }

        options.drawMetrics.value = data
            ? {
                  ...data,
                  GeoJSON: routeGeom ?? data.GeoJSON
              }
            : null
        options.drawnPositions.value = positions
        options.sectionPointRanges.value = createInitialSectionPointRanges(positions.length)
        options.sectionDraft.value = createInitialSectionDraft(positions, routeGeom)
        redrawSectionGraphics()
        return positions
    }

    /** 진행 중인 드로잉을 취소하고 지도 위 구간 그래픽을 정리한다. */
    const cancelDrawing = () => {
        if (!options.viewer.value) {
            return
        }

        isDrawingActive.value = false
        options.viewer.value._cancelDrawAction()
        clearSectionGraphics()
    }

    /** 진행 중인 드로잉을 현재 포인트로 완료한다. (모바일 우클릭 대체) */
    const finishDrawing = () => {
        if (!options.viewer.value) {
            return
        }

        options.viewer.value._finishDrawAction()
    }

    /**
     * 현재 구간 초안을 Zod 스키마로 파싱하고 저장 모달을 연다.
     * 드로잉된 경로가 없거나 구간 초안이 없으면 경고를 표시하고 중단한다.
     * "저장" 버튼 클릭 이벤트에 연결한다.
     */
    const handleDrawSave = () => {
        if (!options.drawnPositions.value?.length || !options.sectionDraft.value) {
            options.notify({
                title: '구간 없음',
                message: '먼저 구간을 그려주세요.',
                tone: NotificationToneEnum.WARNING
            })
            return
        }

        options.sectionDraft.value = createSectionSchema.parse(options.sectionDraft.value)
        options.isRouteSaveModalOpen.value = true
    }

    /**
     * 구간 초안의 특정 구간 속성(이름·코멘트·설명)을 업데이트한다.
     * 사이드바 구간 입력 필드의 변경 이벤트에 연결한다.
     *
     * @param payload - 수정할 구간 인덱스, 필드명, 새 값을 담은 객체
     * @param payload.index - 수정할 구간의 인덱스
     * @param payload.field - 수정할 필드명 (`'name'` | `'comment'` | `'description'`)
     * @param payload.value - 사용자가 입력한 새 값
     */
    const handleUpdateSectionAttr = (payload: {
        index: number
        field: 'name' | 'comment' | 'description'
        value: string
    }) => {
        if (!options.sectionDraft.value) {
            return
        }

        options.sectionDraft.value = updateSectionDraftAttr(options.sectionDraft.value, payload)
    }

    /**
     * 특정 구간을 삭제하고 직전 구간과 병합한다.
     * 구간 범위 배열과 구간 속성 배열을 함께 갱신한 뒤 지도 그래픽을 다시 그린다.
     * 구간 삭제 버튼 클릭 이벤트에 연결한다.
     *
     * @param payload.index - 삭제할 구간의 인덱스
     */
    const handleRemoveSection = ({ index }: { index: number }) => {
        if (!options.sectionDraft.value) {
            return
        }

        options.sectionPointRanges.value = mergeSectionPointRanges(
            options.sectionPointRanges.value,
            index
        )
        const nextDraft = removeSectionDraftAttr(options.sectionDraft.value, index)
        options.sectionDraft.value = {
            ...nextDraft,
            attrs: syncSectionAttrs(nextDraft.attrs ?? [], options.sectionPointRanges.value)
        }
        redrawSectionGraphics()
    }

    /**
     * 특정 구간의 포인트를 시각화하여 사용자가 분할 지점을 직접 선택하도록 한다.
     * 포인트가 충분하지 않으면 경고를 표시한다.
     */
    const handleAddSection = ({ index }: { index: number }) => {
        if (!options.sectionDraft.value) return

        const range = options.sectionPointRanges.value[index]
        if (!range || range.end - range.start < 2) {
            options.notify({
                title: '구간 나누기 불가',
                message: '포인트가 충분하지 않아 구간을 나눌 수 없습니다.',
                tone: NotificationToneEnum.WARNING
            })
            return
        }

        enterSplitMode(index)
    }

    if (options.closingMode) {
        watch(options.closingMode, () => {
            redrawSectionGraphics()
        })
    }

    onBeforeUnmount(() => {
        exitSplitMode()
        sectionPolylines.clear()
        sectionPoints.clear()
    })

    return {
        cancelDrawing,
        finishDrawing,
        isDrawingActive: readonly(isDrawingActive),
        splitMode: readonly(splitMode),
        handleDrawReset,
        handleDrawSave,
        handleUpdateSectionAttr,
        handleRemoveSection,
        handleAddSection,
        exitSplitMode,
        redrawSectionGraphics,
        hideSectionPolylines: () => sectionPolylines.hide(),
        showSectionPolylines: () => sectionPolylines.show()
    }
}
export default useRouteDrawSideeffect
