// 그리기 상태(positions·sectionDraft·closingMode 등)를 서버 저장 페이로드로 변환하는 빌더 함수.
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { PoiDraftInput } from '#shared/types/facility'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import type { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import type { DrawActionData } from '~/shared/lib/useWindow'
import { createSectionSchema } from '#shared/schemas/route.schema'
import {
    createDefaultSectionAttr,
    createHeightAwareRouteGeom,
    createSectionDraftsFromRanges,
    type SectionPointRange
} from '~/entities/route/lib/useRouteDrawDraft'
import { RouteDraftAssembler } from '~/entities/route/lib/useRouteDraftBuilder'

export interface BuildRouteSavePayloadInput {
    sectionDraft: CreateSectionSchema | null
    drawnPositions: GeoJsonPosition[] | null
    closingMode: RouteClosingModeEnum | null
    sectionPointRanges: SectionPointRange[]
    drawMetrics: DrawActionData | null
    routeForm: { title: string; description?: string | null }
    sectionPois: Record<number, PoiDraftInput[]>
}

/**
 * 그리기 상태를 서버 저장용 페이로드(routeDraft + section[]) 로 변환한다.
 * 도착지 연결(loopClose)·왕복(roundTrip) 분기와 RouteDraftAssembler 조립 로직을 포함한다.
 *
 * 호출부에서 입력값이 없을 때는 Error를 던지므로, 호출부는 try/catch로 메시지를 표면화하면 된다.
 */
export const buildRouteSavePayload = (input: BuildRouteSavePayloadInput) => {
    const {
        sectionDraft,
        drawnPositions,
        closingMode,
        sectionPointRanges,
        drawMetrics,
        routeForm,
        sectionPois
    } = input

    if (!sectionDraft) {
        throw new Error('먼저 구간을 그려주세요.')
    }
    if (!drawnPositions?.length) {
        throw new Error('경로 포인트가 없습니다.')
    }

    const originalPositions = drawnPositions
    const sectionPayload = createSectionSchema.parse(sectionDraft)

    let positions = originalPositions
    let ranges = sectionPointRanges
    let attrs = sectionPayload.attrs ?? []

    // 도착지 연결: 마지막점 → 첫점을 1개 구간으로 추가
    if (closingMode?.isLoopClose && originalPositions.length >= 2) {
        positions = [...originalPositions, originalPositions[0]!]
        ranges = [...ranges, { start: originalPositions.length - 1, end: originalPositions.length }]
        attrs = [...attrs, createDefaultSectionAttr(attrs.length)]
    }

    // 왕복 코스: 역순 경로를 원래 구간 수만큼 미러링하여 추가
    if (closingMode?.isRoundTrip && originalPositions.length >= 2) {
        const returnPositions = [...originalPositions].reverse()
        positions = [...originalPositions, ...returnPositions]

        const originalLength = originalPositions.length
        const reversedRanges = [...ranges].reverse()
        let cursor = originalLength
        const returnRanges = reversedRanges.map((r) => {
            const size = r.end - r.start + 1
            const range = { start: cursor, end: cursor + size - 1 }
            cursor = range.end
            return range
        })
        ranges = [...ranges, ...returnRanges]
        attrs = [
            ...attrs,
            ...returnRanges.map((_, i) => createDefaultSectionAttr(attrs.length + i))
        ]
    }

    const routeGeom = createHeightAwareRouteGeom(drawMetrics ?? undefined, positions)
    const assembler = new RouteDraftAssembler()
        .withPositions(positions)
        .withDrawMetrics({
            ...(drawMetrics ?? {}),
            geoJson: routeGeom,
            closingMode
        })
        .withSectionAttrs(attrs)
        .withClosingMode(closingMode)

    const { route: routeDraftPayload } = assembler.build(routeForm)
    const sectionPayloads = createSectionDraftsFromRanges(
        attrs,
        ranges,
        positions,
        undefined,
        routeGeom
    ).map((section, index) => ({
        ...section,
        pois: sectionPois[index] ?? []
    }))

    return { routeDraftPayload, sectionPayloads }
}
