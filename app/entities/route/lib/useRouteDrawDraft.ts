import type { Cartesian3 } from 'cesium'
import type { DrawActionData } from '~/shared/lib/useWindow'
import type { CreateSectionSchema, SectionAttrSchema } from '#shared/schemas/route.schema'
import type { GeoJsonLineString, GeoJsonPosition } from '#shared/types/geojson'
import { createSectionSchema } from '#shared/schemas/route.schema'
import {
    extractLineStringGeometry,
    toLineStringCoordinate
} from '~/entities/route/lib/useRouteDrawUtils'

/** 지도에서 그린 폴리라인을 구간(Section)으로 분할할 때 각 구간이 담당하는 포인트 인덱스 범위 */
export interface SectionPointRange {
    /** 구간의 시작 포인트 인덱스 (inclusive) */
    start: number
    /** 구간의 종료 포인트 인덱스 (inclusive) */
    end: number
}

/**
 * 새 구간의 기본 속성 객체를 생성한다.
 * 사용자가 아직 구간명/코멘트/설명을 입력하지 않은 초기 상태에 사용한다.
 *
 * @param index - 구간 목록에서의 순서 인덱스 (0-based). `seq` 값으로 저장된다.
 * @returns 이름·코멘트·설명이 모두 `undefined`인 기본 구간 속성
 */
export const createDefaultSectionAttr = (index: number): SectionAttrSchema => ({
    seq: index,
    name: undefined,
    comment: undefined,
    description: undefined
})

/**
 * 포인트 배열을 구간 범위 배열로 변환한다.
 * N개의 포인트는 N-1개의 구간(인접한 포인트 쌍)을 생성한다.
 * 지도 드로잉 완료 직후 구간 초기 상태를 구성할 때 호출한다.
 *
 * @param pointCount - 드로잉된 전체 포인트 수
 * @returns `[{start:0, end:1}, {start:1, end:2}, ...]` 형태의 구간 범위 배열.
 *          포인트가 1개 이하이면 빈 배열을 반환한다.
 */
export const createInitialSectionPointRanges = (pointCount: number): SectionPointRange[] =>
    Array.from({ length: Math.max(pointCount - 1, 0) }, (_, index) => ({
        start: index,
        end: index + 1
    }))

/**
 * 최적화된 경로에서 원본 waypoint의 위치를 찾아 구간 범위를 생성한다.
 * 사용자가 클릭한 N개 waypoint를 기준으로 N-1개 section을 만든다.
 *
 * @param optimizedPositions - 최적화 API가 반환한 전체 포인트 배열
 * @param originalWaypoints - 사용자가 클릭한 원본 waypoint 배열
 * @returns waypoint 기준 구간 범위 배열
 */
export const createWaypointBasedSectionRanges = (
    optimizedPositions: GeoJsonPosition[],
    originalWaypoints: GeoJsonPosition[]
): SectionPointRange[] => {
    if (originalWaypoints.length < 2 || optimizedPositions.length < 2) {
        return createInitialSectionPointRanges(optimizedPositions.length)
    }

    const findClosestIndex = (target: GeoJsonPosition, from: number): number => {
        let bestIndex = from
        let bestDist = Infinity

        for (let i = from; i < optimizedPositions.length; i++) {
            const p = optimizedPositions[i]!
            const dLon = p[0] - target[0]
            const dLat = p[1] - target[1]
            const dist = dLon * dLon + dLat * dLat

            if (dist < bestDist) {
                bestDist = dist
                bestIndex = i
            }
        }

        return bestIndex
    }

    const waypointIndices: number[] = [0]
    let searchFrom = 1

    for (let w = 1; w < originalWaypoints.length; w++) {
        const idx = findClosestIndex(originalWaypoints[w]!, searchFrom)
        waypointIndices.push(idx)
        searchFrom = idx + 1
    }

    // 마지막 waypoint는 항상 마지막 포인트를 가리켜야 함
    waypointIndices[waypointIndices.length - 1] = optimizedPositions.length - 1

    return waypointIndices.slice(0, -1).map((startIdx, i) => ({
        start: startIdx,
        end: waypointIndices[i + 1]!
    }))
}

/**
 * 드로잉 결과와 샘플링된 고도 포인트를 결합해 고도 정보가 포함된 LineString GeoJSON을 만든다.
 * 좌표 수가 일치하면 GeoJSON 원본 좌표를 기준으로 하고, 불일치 시 `positions`로 대체한다.
 *
 * @param data - Cesium 드로잉 helper가 반환한 측정값. 없으면 `positions`만 사용한다.
 * @param positions - 테레인 샘플링 후 고도가 채워진 WGS84 포인트 배열
 * @returns 고도 포함 LineString GeoJSON. 포인트가 없으면 `undefined`.
 */
export const createHeightAwareRouteGeom = (
    data: DrawActionData | undefined,
    positions: GeoJsonPosition[]
): GeoJsonLineString | undefined => {
    const lineString = extractLineStringGeometry(data?.GeoJSON)
    const baseCoordinates =
        lineString?.coordinates.length === positions.length
            ? lineString.coordinates
            : positions.map((c) => toLineStringCoordinate(c))

    if (baseCoordinates.length === 0) {
        return undefined
    }

    return {
        type: 'LineString',
        coordinates: baseCoordinates.map(
            (coordinate, index) =>
                [
                    coordinate[0],
                    coordinate[1],
                    positions[index]?.[2] ?? coordinate[2] ?? data?.heights?.[index] ?? 0
                ] as GeoJsonPosition
        )
    }
}

const sliceLineStringByRange = (
    geom: GeoJsonLineString,
    range: SectionPointRange
): GeoJsonLineString => ({
    type: 'LineString',
    coordinates: geom.coordinates.slice(range.start, range.end + 1)
})

export const toSectionGeom = (
    positions: Array<Cartesian3 | GeoJsonPosition>,
    wgs84Array?: GeoJsonPosition[]
): GeoJsonLineString => ({
    type: 'LineString',
    coordinates: (wgs84Array?.length ? wgs84Array : positions).map((c) => toLineStringCoordinate(c))
})

export const createSectionDraftsFromRanges = (
    attrs: SectionAttrSchema[],
    ranges: SectionPointRange[],
    positions: GeoJsonPosition[],
    wgs84Array?: GeoJsonPosition[],
    routeGeom?: GeoJsonLineString
): CreateSectionSchema[] =>
    ranges.map((range, index) =>
        createSectionSchema.parse({
            routeId: 'draft-route',
            geom: routeGeom
                ? sliceLineStringByRange(routeGeom, range)
                : toSectionGeom(
                      positions.slice(range.start, range.end + 1),
                      wgs84Array?.slice(range.start, range.end + 1)
                  ),
            attrs: [{ ...(attrs[index] ?? createDefaultSectionAttr(index)), seq: index }]
        })
    )

/**
 * 드로잉 결과로부터 구간 초안(draft)을 생성한다.
 * 저장 모달이 열리기 직전, 지도 드로잉이 완료된 시점에 호출한다.
 * 포인트 N개 → N-1개의 빈 구간 속성을 자동으로 생성한다.
 *
 * @param positions - Cesium 드로잉 helper가 반환한 3D 포인트 배열
 * @param wgs84Array - WGS84 좌표 배열. `toSectionGeom`으로 전달되어 geom 필드에 사용된다.
 * @returns Zod 스키마(`createSectionSchema`)로 파싱된 구간 초안 객체
 */
export const createInitialSectionDraft = (
    positions: GeoJsonPosition[],
    routeGeom?: GeoJsonLineString,
    wgs84Array?: GeoJsonPosition[]
) =>
    createSectionSchema.parse(
        (() => {
            const ranges = createInitialSectionPointRanges(positions.length)

            return {
                routeId: 'draft-route',
                geom: routeGeom ?? toSectionGeom(positions, wgs84Array),
                attrs: ranges.map((_, index) => createDefaultSectionAttr(index))
            }
        })()
    )

export const syncSectionAttrs = (
    attrs: SectionAttrSchema[],
    ranges: SectionPointRange[]
): SectionAttrSchema[] =>
    ranges.map((_, index) => {
        const currentAttr = attrs[index] ?? createDefaultSectionAttr(index)

        return {
            ...currentAttr,
            seq: index
        }
    })

/**
 * 구간 초안의 특정 구간 속성을 수정한다.
 * 사용자가 구간 이름·코멘트·설명을 입력할 때마다 호출된다.
 * 빈 문자열 입력은 `undefined`로 정규화하여 저장한다.
 *
 * @param draft - 현재 구간 초안 전체 객체
 * @param payload - 수정할 구간과 필드 정보
 * @param payload.index - 수정할 구간의 인덱스
 * @param payload.field - 수정할 필드명 (`'name'` | `'comment'` | `'description'`)
 * @param payload.value - 사용자가 입력한 새 값. 빈 문자열이면 `undefined`로 저장된다.
 * @returns 해당 구간 속성이 업데이트된 새 초안 객체 (불변 업데이트)
 */
export const updateSectionDraftAttr = (
    draft: CreateSectionSchema,
    payload: { index: number; field: 'name' | 'comment' | 'description'; value: string }
) => {
    const attrs = [...(draft.attrs ?? [])]
    const currentAttr = attrs[payload.index] ?? createDefaultSectionAttr(payload.index)

    attrs[payload.index] = {
        ...currentAttr,
        [payload.field]: payload.value || undefined
    }

    return {
        ...draft,
        attrs
    }
}

/**
 * 구간 초안에서 특정 구간 속성을 제거하고 나머지 구간의 `seq`를 재정렬한다.
 * 사용자가 구간 분리를 취소하거나 구간을 병합할 때 호출된다.
 *
 * @param draft - 현재 구간 초안 전체 객체
 * @param index - 제거할 구간 속성의 인덱스
 * @returns 해당 구간이 제거되고 `seq`가 재정렬된 새 초안 객체 (불변 업데이트)
 */
export const removeSectionDraftAttr = (draft: CreateSectionSchema, index: number) => ({
    ...draft,
    attrs: (draft.attrs ?? [])
        .filter((_, attrIndex) => attrIndex !== index)
        .map((attr, attrIndex) => ({
            ...attr,
            seq: attrIndex
        }))
})

/**
 * 구간 범위 배열에서 특정 인덱스의 구간을 앞 구간과 병합한다.
 * 사용자가 구간 구분점을 제거하면 해당 구간의 포인트 범위가 직전 구간으로 흡수된다.
 * `removeSectionDraftAttr`와 함께 호출하여 포인트 범위와 속성을 동시에 동기화해야 한다.
 *
 * @param ranges - 현재 구간 범위 배열
 * @param index - 제거할 구간의 인덱스. 0이거나 마지막 인덱스를 초과하면 변경 없이 원본을 반환한다.
 * @returns `index`의 구간이 제거되고 직전 구간의 `end`가 확장된 새 범위 배열 (불변 업데이트)
 */
/**
 * 구간 범위 배열에서 특정 인덱스의 구간을 중간 지점에서 둘로 분할한다.
 * 경로 그리기 도중 새로운 구간을 삽입할 때 호출한다.
 *
 * @param ranges - 현재 구간 범위 배열
 * @param index - 분할할 구간의 인덱스
 * @returns 해당 구간이 둘로 분할된 새 범위 배열 (불변 업데이트)
 */
export const splitSectionPointRange = (
    ranges: SectionPointRange[],
    index: number
): SectionPointRange[] => {
    const range = ranges[index]
    if (!range || range.end - range.start < 2) return ranges

    const mid = Math.floor((range.start + range.end) / 2)
    const nextRanges = [...ranges]
    nextRanges.splice(index, 1, { start: range.start, end: mid }, { start: mid, end: range.end })
    return nextRanges
}

/**
 * 구간 범위 배열에서 특정 인덱스의 구간을 지정한 포인트에서 둘로 분할한다.
 * 사용자가 지도에서 포인트를 클릭하여 분할 위치를 직접 선택할 때 호출한다.
 *
 * @param ranges - 현재 구간 범위 배열
 * @param sectionIndex - 분할할 구간의 인덱스
 * @param pointIndex - 분할 기준 포인트의 전체 인덱스
 * @returns 해당 구간이 지정 포인트에서 분할된 새 범위 배열 (불변 업데이트)
 */
export const splitSectionAtPoint = (
    ranges: SectionPointRange[],
    sectionIndex: number,
    pointIndex: number
): SectionPointRange[] => {
    const range = ranges[sectionIndex]
    if (!range || pointIndex <= range.start || pointIndex >= range.end) return ranges

    const nextRanges = [...ranges]
    nextRanges.splice(
        sectionIndex,
        1,
        { start: range.start, end: pointIndex },
        { start: pointIndex, end: range.end }
    )
    return nextRanges
}

export const mergeSectionPointRanges = (ranges: SectionPointRange[], index: number) => {
    if (index <= 0 || index >= ranges.length) {
        return ranges
    }

    const nextRanges = [...ranges]
    const previousRange = nextRanges[index - 1]
    const removedRange = nextRanges[index]

    if (!previousRange || !removedRange) {
        return ranges
    }

    nextRanges[index - 1] = {
        ...previousRange,
        end: removedRange.end
    }
    nextRanges.splice(index, 1)

    return nextRanges
}
