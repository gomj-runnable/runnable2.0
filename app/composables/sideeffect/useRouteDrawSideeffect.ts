import type { Ref, ShallowRef } from 'vue'
import type {
    DrawActionData,
    MapPrimeEntity,
    MapPrimePosition,
    MapPrimeViewer
} from '~/composables/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import { createSectionSchema } from '#shared/schemas/route.schema'
import {
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    mergeSectionPointRanges,
    removeSectionDraftAttr,
    syncSectionAttrs,
    updateSectionDraftAttr
} from '~/composables/action/useRouteDrawDraft'
import { SECTION_COLORS, SECTION_START_MARKER_COLOR } from '#shared/constants/route'

/**
 * `useRouteDrawSideeffect`에 주입하는 의존성 옵션.
 * store의 ref들을 직접 전달받아 사이드이펙트 결과를 store에 반영한다.
 */
interface UseRouteDrawSideeffectOptions {
    /** 초기화된 MapPrime 뷰어 인스턴스 ref. 뷰어가 준비되지 않은 경우 `null`. */
    viewer: ShallowRef<MapPrimeViewer | null>
    /** 드로잉 완료 후 저장할 3D 포인트 배열 ref */
    drawnPositions: Ref<MapPrimePosition[] | null>
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
}

/**
 * 구간 순서를 기반으로 팔레트 색상을 순환 선택한다.
 *
 * @param sectionIndex - 구간 순서 인덱스
 * @returns 팔레트에서 선택된 hex 색상 문자열
 */
const getSectionColor = (sectionIndex: number): string =>
    SECTION_COLORS[sectionIndex % SECTION_COLORS.length] ?? SECTION_COLORS[0]

/**
 * 경로 드로잉과 구간 그래픽 렌더링을 담당하는 sideeffect composable.
 * MapPrime 뷰어 API를 직접 호출하여 폴리라인·포인트를 지도에 그리고,
 * 드로잉 이벤트(리셋·저장·구간 수정·구간 삭제)를 처리한다.
 * 상태 반영은 주입받은 `options`의 ref를 통해 store에 위임한다.
 *
 * @param options - store ref와 초기화 함수를 담은 의존성 옵션
 */
const useRouteDrawSideeffect = (options: UseRouteDrawSideeffectOptions) => {
    /** 현재 지도에 그려진 구간 폴리라인 엔티티 목록 */
    const drawnSectionPolylines = shallowRef<MapPrimeEntity[]>([])

    /** 현재 지도에 그려진 구간 경계 포인트 엔티티 목록 (구간별 배열) */
    const drawnSectionPoints = shallowRef<MapPrimeEntity[][]>([])

    /**
     * 단일 구간의 폴리라인을 지도에 그린다.
     * 포인트가 2개 미만이거나 뷰어가 없으면 `null`을 반환한다.
     *
     * @param positions - 구간에 포함될 3D 포인트 배열
     * @param sectionIndex - 구간 순서 인덱스 (색상 선택에 사용)
     * @returns 생성된 폴리라인 엔티티, 뷰어 미준비 시 `null`
     */
    const drawSection = (
        positions: MapPrimePosition[],
        sectionIndex: number
    ): MapPrimeEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        const color = getSectionColor(sectionIndex)

        return options.viewer.value._createEntity('polyline', {
            positions,
            width: 4,
            clampToGround: true,
            color,
            opacity: 0.95
        })
    }

    /**
     * 단일 포인트 마커를 지도에 그린다.
     * 구간 시작점(흰색)과 구간 끝점(구간 색상)을 구분하여 표시할 때 사용한다.
     *
     * @param position - 마커를 배치할 3D 포인트
     * @param color - 마커 색상 (hex 문자열)
     * @returns 생성된 포인트 엔티티 배열, 뷰어 미준비 시 빈 배열
     */
    const createRoutePoint = (position: MapPrimePosition, color: string): MapPrimeEntity[] => {
        if (!options.viewer.value) {
            return []
        }

        return options.viewer.value._createPoint({
            positions: position,
            color,
            opacity: 0.95,
            clampToGround: true
        })
    }

    /**
     * 지도에서 그래픽(폴리라인) 엔티티 목록을 일괄 제거한다.
     *
     * @param entities - 제거할 MapPrime 그래픽 엔티티 배열
     */
    const removeGraphics = (entities: MapPrimeEntity[]) => {
        if (!options.viewer.value) {
            return
        }

        entities.forEach((entity) => options.viewer.value?._removeGraphic(entity))
    }

    /**
     * 지도에서 포인트 엔티티 그룹을 일괄 제거한다.
     *
     * @param entityGroups - 구간별로 묶인 포인트 엔티티 이중 배열
     */
    const removePointEntities = (entityGroups: MapPrimeEntity[][]) => {
        if (!options.viewer.value) {
            return
        }

        entityGroups.flat().forEach((entity) => options.viewer.value?._removeEntity(entity))
    }

    /**
     * 현재 지도에 그려진 모든 구간 폴리라인과 포인트 마커를 제거한다.
     * 새 드로잉 시작 또는 상태 리셋 전에 호출한다.
     */
    const clearSectionGraphics = () => {
        removeGraphics(drawnSectionPolylines.value)
        removePointEntities(drawnSectionPoints.value)
        drawnSectionPolylines.value = []
        drawnSectionPoints.value = []
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

        drawnSectionPolylines.value = ranges
            .map((range, index) => {
                const sectionPoints = positions.slice(range.start, range.end + 1)

                return sectionPoints.length >= 2 ? drawSection(sectionPoints, index) : null
            })
            .filter((entity): entity is MapPrimeEntity => entity !== null)

        const routePointEntities: MapPrimeEntity[][] = []
        const firstPoint = positions[0]

        if (firstPoint) {
            routePointEntities.push(createRoutePoint(firstPoint, SECTION_START_MARKER_COLOR))
        }

        ranges.forEach((range, index) => {
            const endPoint = positions[range.end]

            if (!endPoint) {
                return
            }

            routePointEntities.push(createRoutePoint(endPoint, getSectionColor(index)))
        })

        drawnSectionPoints.value = routePointEntities
    }

    /**
     * 드로잉을 초기화하고 새 경로 드로잉을 시작한다.
     * 기존 그래픽과 상태를 모두 제거한 뒤 MapPrime `_drawAction`을 실행한다.
     * 드로잉 완료 시 store의 포인트·측정값·구간 초안을 갱신하고 구간 그래픽을 다시 그린다.
     * "그리기" 버튼 클릭 이벤트에 연결한다.
     */
    const handleDrawReset = async () => {
        if (!options.viewer.value) {
            alert('지도를 아직 불러오는 중입니다.')
            return
        }

        clearSectionGraphics()
        options.resetRouteDrawState()

        alert('좌클릭: 구간 추가\n우클릭: 완료')

        const result = await options.viewer.value._drawAction({
            shapeType: 1,
            showLabel: true
        })

        if (!result || !('data' in result) || !result.data) {
            if (result && 'message' in result && result.message) {
                alert(result.message)
            }
            return
        }

        const data = result.data
        const positions = data?.positions

        if (!Array.isArray(positions) || positions.length === 0) {
            return
        }

        options.drawMetrics.value = data ?? null
        options.drawnPositions.value = positions
        options.sectionPointRanges.value = createInitialSectionPointRanges(positions.length)
        options.sectionDraft.value = createInitialSectionDraft(positions, data?.wgs84Array)
        redrawSectionGraphics()
    }

    /** 진행 중인 드로잉을 취소하고 지도 위 구간 그래픽을 정리한다. */
    const cancelDrawing = () => {
        if (!options.viewer.value) {
            return
        }

        options.viewer.value._cancelDrawAction()
        clearSectionGraphics()
    }

    /**
     * 현재 구간 초안을 Zod 스키마로 파싱하고 저장 모달을 연다.
     * 드로잉된 경로가 없거나 구간 초안이 없으면 경고를 표시하고 중단한다.
     * "저장" 버튼 클릭 이벤트에 연결한다.
     */
    const handleDrawSave = () => {
        if (!options.drawnPositions.value?.length || !options.sectionDraft.value) {
            alert('먼저 구간을 그려주세요.')
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

    return {
        cancelDrawing,
        handleDrawReset,
        handleDrawSave,
        handleUpdateSectionAttr,
        handleRemoveSection
    }
}
export default useRouteDrawSideeffect
