import type { MapPrimePosition, Wgs84Coordinate } from '~/composables/useWindow'
import type { CreateSectionSchema, SectionAttrSchema } from '#shared/schemas/route.schema'
import type { GeoJsonLineString, GeoJsonLineStringPosition } from '#shared/types/route'
import { createSectionSchema } from '#shared/schemas/route.schema'

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
 * 포인트 배열을 GeoJSON LineString 문자열로 변환한다.
 * WGS84 좌표 배열이 있으면 그것을 우선 사용하고, 없으면 MapPrime 내부 좌표를 사용한다.
 * 구간 초안의 `geom` 필드를 채울 때 사용한다.
 *
 * @param positions - MapPrime 뷰어에서 반환된 3D 내부 좌표 배열
 * @param wgs84Array - 경위도 기반 WGS84 좌표 배열 (있으면 우선 적용)
 * @returns GeoJSON LineString 형식의 직렬화된 문자열
 */
const cartesianToWgs84Coordinate = (position: MapPrimePosition): GeoJsonLineStringPosition => {
    const cartographic = window.Cesium.Cartographic.fromCartesian(position)

    return [
        window.Cesium.Math.toDegrees(cartographic.longitude),
        window.Cesium.Math.toDegrees(cartographic.latitude),
        0
    ]
}

const toLineStringCoordinate = (
    coordinate: Wgs84Coordinate | MapPrimePosition
): GeoJsonLineStringPosition =>
    Array.isArray(coordinate)
        ? [coordinate[0], coordinate[1], 0]
        : cartesianToWgs84Coordinate(coordinate)

export const toSectionGeom = (
    positions: MapPrimePosition[],
    wgs84Array?: Wgs84Coordinate[]
): GeoJsonLineString => ({
    type: 'LineString',
    coordinates: (wgs84Array?.length ? wgs84Array : positions).map(toLineStringCoordinate)
})

export const createSectionDraftsFromRanges = (
    attrs: SectionAttrSchema[],
    ranges: SectionPointRange[],
    positions: MapPrimePosition[],
    wgs84Array?: Wgs84Coordinate[]
): CreateSectionSchema[] =>
    ranges.map((range, index) =>
        createSectionSchema.parse({
            routeId: 'draft-route',
            geom: toSectionGeom(
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
 * @param positions - MapPrime 뷰어에서 반환된 3D 포인트 배열
 * @param wgs84Array - WGS84 좌표 배열. `toSectionGeom`으로 전달되어 geom 필드에 사용된다.
 * @returns Zod 스키마(`createSectionSchema`)로 파싱된 구간 초안 객체
 */
export const createInitialSectionDraft = (
    positions: MapPrimePosition[],
    wgs84Array?: Wgs84Coordinate[]
) =>
    createSectionSchema.parse(
        (() => {
            const ranges = createInitialSectionPointRanges(positions.length)

            return {
                routeId: 'draft-route',
                geom: toSectionGeom(positions, wgs84Array),
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
