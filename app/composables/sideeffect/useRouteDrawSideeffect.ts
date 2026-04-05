import type { Ref, ShallowRef } from 'vue'
import type { DrawActionData, MapPrimeEntity, MapPrimeViewer } from '~/composables/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import { createSectionSchema } from '#shared/schemas/route.schema'
import {
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    mergeSectionPointRanges,
    removeSectionDraftAttr,
    updateSectionDraftAttr
} from '~/composables/action/useRouteDrawDraft'

interface UseRouteDrawSideeffectOptions {
    viewer: ShallowRef<MapPrimeViewer | null>
    drawnPositions: Ref<unknown[] | null>
    drawMetrics: Ref<DrawActionData | null>
    sectionDraft: Ref<CreateSectionSchema | null>
    sectionPointRanges: Ref<Array<{ start: number; end: number }>>
    isRouteSaveModalOpen: Ref<boolean>
    resetRouteDrawState: () => void
}

export const useRouteDrawSideeffect = (options: UseRouteDrawSideeffectOptions) => {
    const drawnSectionPolylines = shallowRef<MapPrimeEntity[]>([])
    const drawnSectionMarkers = shallowRef<MapPrimeEntity[]>([])

    const createPolyline = (positions: unknown): MapPrimeEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        return options.viewer.value._createEntity('polyline', {
            positions,
            width: 8,
            clampToGround: false,
            color: '#57B9FF',
            opacity: 0.95
        })
    }

    const createSectionStartMarker = (position: unknown): MapPrimeEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        return options.viewer.value._createEntity('point', {
            position,
            pixelSize: 10,
            color: '#CCFF00',
            outlineColor: '#131416',
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        })
    }

    const removeGraphics = (entities: MapPrimeEntity[]) => {
        if (!options.viewer.value) {
            return
        }

        entities.forEach((entity) => options.viewer.value?._removeGraphic(entity))
    }

    const clearSectionGraphics = () => {
        removeGraphics(drawnSectionPolylines.value)
        removeGraphics(drawnSectionMarkers.value)
        drawnSectionPolylines.value = []
        drawnSectionMarkers.value = []
    }

    const redrawSectionGraphics = () => {
        const positions = Array.isArray(options.drawnPositions.value) ? options.drawnPositions.value : []
        const ranges = options.sectionPointRanges.value

        clearSectionGraphics()

        if (!options.viewer.value || positions.length < 2 || ranges.length === 0) {
            return
        }

        drawnSectionPolylines.value = ranges
            .map((range) => {
                const sectionPoints = positions.slice(range.start, range.end + 1)

                return sectionPoints.length >= 2 ? createPolyline(sectionPoints) : null
            })
            .filter((entity): entity is MapPrimeEntity => entity !== null)

        drawnSectionMarkers.value = ranges
            .map((range) => {
                const startPoint = positions[range.start]

                return startPoint ? createSectionStartMarker(startPoint) : null
            })
            .filter((entity): entity is MapPrimeEntity => entity !== null)
    }

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

    const handleDrawSave = () => {
        if (!options.drawnPositions.value?.length || !options.sectionDraft.value) {
            alert('먼저 구간을 그려주세요.')
            return
        }

        options.sectionDraft.value = createSectionSchema.parse(options.sectionDraft.value)
        options.isRouteSaveModalOpen.value = true
    }

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

    const handleRemoveSection = ({ index }: { index: number }) => {
        if (!options.sectionDraft.value) {
            return
        }

        options.sectionPointRanges.value = mergeSectionPointRanges(options.sectionPointRanges.value, index)
        options.sectionDraft.value = removeSectionDraftAttr(options.sectionDraft.value, index)
        redrawSectionGraphics()
    }

    return {
        handleDrawReset,
        handleDrawSave,
        handleUpdateSectionAttr,
        handleRemoveSection
    }
}
