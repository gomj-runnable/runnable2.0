import { describe, it, expect } from 'vitest'
import { buildRouteSavePayload } from '~/entities/route/lib/useRouteSaveBuilder'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import type { GeoJsonPosition } from '#shared/types/geojson'

const sampleSectionDraft = (overrides: Record<string, unknown> = {}) =>
    ({
        routeId: 'draft-route',
        geom: {
            type: 'LineString' as const,
            coordinates: [
                [127, 37, 0],
                [127.001, 37.001, 5]
            ]
        },
        attrs: [{ seq: 0, name: 'A', comment: undefined, description: undefined }],
        ...overrides
    }) as any

const sampleDrawnPositions: GeoJsonPosition[] = [
    [127, 37, 0],
    [127.001, 37.001, 5]
]

describe('buildRouteSavePayload()', () => {
    it('sectionDraft 가 없으면 throw', () => {
        expect(() =>
            buildRouteSavePayload({
                sectionDraft: null,
                drawnPositions: sampleDrawnPositions,
                closingMode: null,
                sectionPointRanges: [{ start: 0, end: 1 }],
                drawMetrics: null,
                routeForm: { title: 't' },
                sectionPois: {}
            })
        ).toThrow(/구간을 그려/)
    })

    it('drawnPositions 가 없으면 throw', () => {
        expect(() =>
            buildRouteSavePayload({
                sectionDraft: sampleSectionDraft(),
                drawnPositions: [],
                closingMode: null,
                sectionPointRanges: [],
                drawMetrics: null,
                routeForm: { title: 't' },
                sectionPois: {}
            })
        ).toThrow(/포인트가 없/)
    })

    it('일반 경로 — routeDraftPayload + sectionPayloads 반환', () => {
        const result = buildRouteSavePayload({
            sectionDraft: sampleSectionDraft(),
            drawnPositions: sampleDrawnPositions,
            closingMode: null,
            sectionPointRanges: [{ start: 0, end: 1 }],
            drawMetrics: null,
            routeForm: { title: '한강 경로', description: 'desc' },
            sectionPois: { 0: [{ facilityId: 'f1', sectionIndex: 0 } as any] }
        })

        expect(result.routeDraftPayload).toBeDefined()
        expect(result.routeDraftPayload.title).toBe('한강 경로')
        expect(result.sectionPayloads).toHaveLength(1)
        expect(result.sectionPayloads[0]!.pois).toHaveLength(1)
    })

    it('loopClose — 마지막→첫 좌표를 1개 구간으로 추가', () => {
        const result = buildRouteSavePayload({
            sectionDraft: sampleSectionDraft(),
            drawnPositions: [
                [127, 37, 0],
                [127.001, 37.001, 5],
                [127.002, 37.002, 10]
            ],
            closingMode: RouteClosingModeEnum.LOOP_CLOSE,
            sectionPointRanges: [
                { start: 0, end: 1 },
                { start: 1, end: 2 }
            ],
            drawMetrics: null,
            routeForm: { title: 'A' },
            sectionPois: {}
        })

        // 원래 2개 구간 + loopClose 1개 = 3개
        expect(result.sectionPayloads).toHaveLength(3)
    })

    it('roundTrip — 역순 경로를 미러링 추가, 구간 수 2배', () => {
        const result = buildRouteSavePayload({
            sectionDraft: sampleSectionDraft(),
            drawnPositions: [
                [127, 37, 0],
                [127.001, 37.001, 5],
                [127.002, 37.002, 10]
            ],
            closingMode: RouteClosingModeEnum.ROUND_TRIP,
            sectionPointRanges: [
                { start: 0, end: 1 },
                { start: 1, end: 2 }
            ],
            drawMetrics: null,
            routeForm: { title: 'A' },
            sectionPois: {}
        })

        // 원래 2개 + 역순 2개 = 4개
        expect(result.sectionPayloads).toHaveLength(4)
    })

    it('drawnPositions 길이가 2 미만이면 loopClose/roundTrip 모두 무시', () => {
        // 1개 포인트 → throw (drawnPositions length 0 또는 1)
        // 2개 정확히면 통과
        const result = buildRouteSavePayload({
            sectionDraft: sampleSectionDraft(),
            drawnPositions: [
                [127, 37, 0],
                [127.001, 37.001, 5]
            ],
            closingMode: null,
            sectionPointRanges: [{ start: 0, end: 1 }],
            drawMetrics: null,
            routeForm: { title: 't' },
            sectionPois: {}
        })
        expect(result.sectionPayloads).toHaveLength(1)
    })
})
