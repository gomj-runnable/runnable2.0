import type { CreateSectionSchema, SectionAttrSchema } from '#shared/schemas/route.schema'
import { createSectionSchema } from '#shared/schemas/route.schema'

export interface SectionPointRange {
    start: number
    end: number
}

export const createDefaultSectionAttr = (index: number): SectionAttrSchema => ({
    seq: index,
    name: undefined,
    comment: undefined,
    description: undefined
})

export const createInitialSectionPointRanges = (pointCount: number): SectionPointRange[] =>
    Array.from({ length: Math.max(pointCount - 1, 0) }, (_, index) => ({
        start: index,
        end: index + 1
    }))

export const toSectionGeom = (positions: unknown[], wgs84Array?: number[][]) =>
    JSON.stringify({
        type: 'LineString',
        coordinates: wgs84Array?.length ? wgs84Array : positions
    })

export const createInitialSectionDraft = (positions: unknown[], wgs84Array?: number[][]) =>
    createSectionSchema.parse({
        routeId: 'draft-route',
        geom: toSectionGeom(positions, wgs84Array),
        attrs: positions.slice(0, -1).map((_, index) => createDefaultSectionAttr(index))
    })

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

export const removeSectionDraftAttr = (draft: CreateSectionSchema, index: number) => ({
    ...draft,
    attrs: (draft.attrs ?? [])
        .filter((_, attrIndex) => attrIndex !== index)
        .map((attr, attrIndex) => ({
            ...attr,
            seq: attrIndex
        }))
})

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
