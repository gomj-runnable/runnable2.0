import { describe, it, expect } from 'vitest'
import {
    geoJsonPointSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema,
    createRouteSchema,
    RouteDraftBuilder,
    RouteDraftAssembler,
    RouteClosingModeEnum,
} from '#shared/schemas/route.schema'

// ─── geoJsonPointSchema ────────────────────────────────────────────────────

describe('geoJsonPointSchema', () => {
    it('유효한 2차원 좌표(lon, lat)를 파싱한다', () => {
        const result = geoJsonPointSchema.parse({ type: 'Point', coordinates: [127.0, 37.5] })
        expect(result.coordinates).toEqual([127.0, 37.5])
    })

    it('유효한 3차원 좌표(lon, lat, alt)를 파싱한다', () => {
        const result = geoJsonPointSchema.parse({ type: 'Point', coordinates: [127.0, 37.5, 50] })
        expect(result.coordinates).toEqual([127.0, 37.5, 50])
    })

    it('좌표가 1개이면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'Point', coordinates: [127.0] })
        expect(result.success).toBe(false)
    })

    it('좌표가 4개 이상이면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'Point', coordinates: [1, 2, 3, 4] })
        expect(result.success).toBe(false)
    })

    it('type이 Point가 아니면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'LineString', coordinates: [127.0, 37.5] })
        expect(result.success).toBe(false)
    })

    it('coordinates가 없으면 실패한다', () => {
        const result = geoJsonPointSchema.safeParse({ type: 'Point' })
        expect(result.success).toBe(false)
    })
})

// ─── geoJsonLineStringSchema ───────────────────────────────────────────────

describe('geoJsonLineStringSchema', () => {
    it('유효한 LineString(3차원 좌표 배열)을 파싱한다', () => {
        const data = {
            type: 'LineString',
            coordinates: [
                [127.0, 37.5, 10],
                [127.1, 37.6, 20],
            ],
        }
        const result = geoJsonLineStringSchema.parse(data)
        expect(result.type).toBe('LineString')
        expect(result.coordinates).toHaveLength(2)
    })

    it('좌표가 빈 배열이어도 파싱된다', () => {
        const result = geoJsonLineStringSchema.parse({ type: 'LineString', coordinates: [] })
        expect(result.coordinates).toEqual([])
    })

    it('각 좌표가 3개 숫자가 아니면 실패한다', () => {
        const result = geoJsonLineStringSchema.safeParse({
            type: 'LineString',
            coordinates: [[127.0, 37.5]], // 2개짜리 tuple은 실패
        })
        expect(result.success).toBe(false)
    })

    it('type이 LineString이 아니면 실패한다', () => {
        const result = geoJsonLineStringSchema.safeParse({
            type: 'Point',
            coordinates: [[127.0, 37.5, 10]],
        })
        expect(result.success).toBe(false)
    })
})

// ─── sectionAttrSchema ────────────────────────────────────────────────────

describe('sectionAttrSchema', () => {
    it('seq만 있어도 파싱된다', () => {
        const result = sectionAttrSchema.parse({ seq: 1 })
        expect(result.seq).toBe(1)
    })

    it('모든 필드가 있으면 파싱된다', () => {
        const result = sectionAttrSchema.parse({
            seq: 2,
            name: '구간 A',
            comment: '메모',
            description: '설명',
        })
        expect(result.name).toBe('구간 A')
    })

    it('seq가 없으면 실패한다', () => {
        const result = sectionAttrSchema.safeParse({ name: '구간 A' })
        expect(result.success).toBe(false)
    })

    it('seq가 정수가 아닌 소수이면 실패한다', () => {
        const result = sectionAttrSchema.safeParse({ seq: 1.5 })
        expect(result.success).toBe(false)
    })
})

// ─── createRouteSchema ────────────────────────────────────────────────────

describe('createRouteSchema', () => {
    it('title만 있어도 파싱된다', () => {
        const result = createRouteSchema.parse({ title: '한강 코스' })
        expect(result.title).toBe('한강 코스')
        expect(result.isPublic).toBe(true) // default
    })

    it('모든 선택 필드를 포함하면 파싱된다', () => {
        const result = createRouteSchema.parse({
            title: '북악 코스',
            description: '설명',
            highHeight: 150,
            lowHeight: 10,
            distance: 5000,
            sgg: ['종로구'],
            emd: ['청운동'],
            isPublic: false,
        })
        expect(result.isPublic).toBe(false)
        expect(result.distance).toBe(5000)
    })

    it('title이 빈 문자열이면 실패한다', () => {
        const result = createRouteSchema.safeParse({ title: '' })
        expect(result.success).toBe(false)
    })

    it('title이 255자를 초과하면 실패한다', () => {
        const result = createRouteSchema.safeParse({ title: 'a'.repeat(256) })
        expect(result.success).toBe(false)
    })

    it('distance가 음수이면 실패한다', () => {
        const result = createRouteSchema.safeParse({ title: '코스', distance: -1 })
        expect(result.success).toBe(false)
    })
})

// ─── RouteDraftBuilder ────────────────────────────────────────────────────

describe('RouteDraftBuilder', () => {
    describe('getDistance()', () => {
        it('closingMode가 없으면 기본 거리를 반환한다', () => {
            const builder = new RouteDraftBuilder({ distance: 1000 })
            expect(builder.getDistance()).toBe(1000)
        })

        it('round-trip 모드이면 거리 × 2를 반환한다', () => {
            const builder = new RouteDraftBuilder({
                distance: 1000,
                closingMode: RouteClosingModeEnum.ROUND_TRIP,
            })
            expect(builder.getDistance()).toBe(2000)
        })

        it('loop-close 모드이면 거리 + loopCloseDistance를 반환한다', () => {
            const builder = new RouteDraftBuilder({
                distance: 1000,
                closingMode: RouteClosingModeEnum.LOOP_CLOSE,
                loopCloseDistance: 200,
            })
            expect(builder.getDistance()).toBe(1200)
        })

        it('loop-close 모드에서 loopCloseDistance가 없으면 거리만 반환한다', () => {
            const builder = new RouteDraftBuilder({
                distance: 1000,
                closingMode: RouteClosingModeEnum.LOOP_CLOSE,
            })
            expect(builder.getDistance()).toBe(1000)
        })

        it('distance가 없으면 undefined를 반환한다', () => {
            const builder = new RouteDraftBuilder({})
            expect(builder.getDistance()).toBeUndefined()
        })

        it('drawMetrics가 null이면 undefined를 반환한다', () => {
            const builder = new RouteDraftBuilder(null)
            expect(builder.getDistance()).toBeUndefined()
        })
    })

    describe('getHeights()', () => {
        it('heights 배열에서 최고·최저 고도를 계산한다', () => {
            const builder = new RouteDraftBuilder({ heights: [10, 50, 30, 5] })
            const { highHeight, lowHeight } = builder.getHeights()
            expect(highHeight).toBe(50)
            expect(lowHeight).toBe(5)
        })

        it('heights에 null/undefined가 섞여 있으면 유효한 숫자만 사용한다', () => {
            const builder = new RouteDraftBuilder({ heights: [null, 20, undefined, 80] })
            const { highHeight, lowHeight } = builder.getHeights()
            expect(highHeight).toBe(80)
            expect(lowHeight).toBe(20)
        })

        it('heights가 비어 있으면 geoJson 좌표의 고도를 사용한다', () => {
            const builder = new RouteDraftBuilder({
                heights: [],
                geoJson: {
                    type: 'LineString',
                    coordinates: [
                        [127.0, 37.5, 15],
                        [127.1, 37.6, 45],
                    ],
                },
            })
            const { highHeight, lowHeight } = builder.getHeights()
            expect(highHeight).toBe(45)
            expect(lowHeight).toBe(15)
        })

        it('heights도 geoJson도 없으면 highHeight/lowHeight가 undefined다', () => {
            const builder = new RouteDraftBuilder({})
            const { highHeight, lowHeight } = builder.getHeights()
            expect(highHeight).toBeUndefined()
            expect(lowHeight).toBeUndefined()
        })
    })

    describe('toRoute()', () => {
        it('title과 거리·고도를 포함한 경로 스키마 객체를 반환한다', () => {
            const builder = new RouteDraftBuilder({ distance: 3000, heights: [10, 100] })
            const route = builder.toRoute({ title: '테스트 경로' })
            expect(route.title).toBe('테스트 경로')
            expect(route.distance).toBe(3000)
            expect(route.highHeight).toBe(100)
            expect(route.lowHeight).toBe(10)
        })

        it('description이 null이면 결과에 포함되지 않는다', () => {
            const builder = new RouteDraftBuilder({})
            const route = builder.toRoute({ title: '코스', description: null })
            expect(route.description).toBeUndefined()
        })

        it('title이 빈 문자열이면 Zod 예외를 던진다', () => {
            const builder = new RouteDraftBuilder({})
            expect(() => builder.toRoute({ title: '' })).toThrow()
        })
    })
})

// ─── RouteDraftAssembler ──────────────────────────────────────────────────

describe('RouteDraftAssembler', () => {
    it('hasPositions: positions를 설정하지 않으면 false다', () => {
        const assembler = new RouteDraftAssembler()
        expect(assembler.hasPositions).toBe(false)
    })

    it('hasPositions: withPositions()로 좌표를 설정하면 true다', () => {
        const assembler = new RouteDraftAssembler()
        assembler.withPositions([[127.0, 37.5, 10]])
        expect(assembler.hasPositions).toBe(true)
    })

    it('hasPositions: 빈 배열을 설정하면 false다', () => {
        const assembler = new RouteDraftAssembler()
        assembler.withPositions([])
        expect(assembler.hasPositions).toBe(false)
    })

    it('build()가 title과 위치 정보를 포함한 결과를 반환한다', () => {
        const assembler = new RouteDraftAssembler()
        assembler
            .withPositions([[127.0, 37.5, 0]])
            .withDrawMetrics({ distance: 500, heights: [10, 20] })

        const result = assembler.build({ title: '짧은 코스' })
        expect(result.route.title).toBe('짧은 코스')
        expect(result.positions).toHaveLength(1)
        expect(result.route.distance).toBe(500)
    })

    it('build()에서 closingMode가 반영된다', () => {
        const assembler = new RouteDraftAssembler()
        assembler
            .withPositions([[127.0, 37.5, 0], [127.1, 37.6, 0]])
            .withDrawMetrics({ distance: 1000 })
            .withClosingMode(RouteClosingModeEnum.ROUND_TRIP)

        const result = assembler.build({ title: '왕복 코스' })
        expect(result.route.distance).toBe(2000)
        expect(result.closingMode).toBe(RouteClosingModeEnum.ROUND_TRIP)
    })

    it('reset() 후 hasPositions는 false로 초기화된다', () => {
        const assembler = new RouteDraftAssembler()
        assembler.withPositions([[127.0, 37.5, 0]])
        assembler.reset()
        expect(assembler.hasPositions).toBe(false)
    })

    it('reset() 후 positions는 null로 초기화된다', () => {
        const assembler = new RouteDraftAssembler()
        assembler.withPositions([[127.0, 37.5, 0]])
        assembler.reset()
        expect(assembler.positions).toBeNull()
    })

    it('reset()은 this를 반환하므로 메서드 체이닝이 가능하다', () => {
        const assembler = new RouteDraftAssembler()
        const returned = assembler.withPositions([[127.0, 37.5, 0]]).reset()
        expect(returned).toBe(assembler)
    })

    it('drawMetrics 없이 build()하면 distance/highHeight가 undefined다', () => {
        const assembler = new RouteDraftAssembler()
        const result = assembler.build({ title: '메트릭 없음' })
        expect(result.route.distance).toBeUndefined()
        expect(result.route.highHeight).toBeUndefined()
    })
})
