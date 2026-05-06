import { describe, it, expect } from 'vitest'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import { RouteDraftBuilder, RouteDraftAssembler } from '~/entities/route/lib/useRouteDraftBuilder'

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
                closingMode: RouteClosingModeEnum.ROUND_TRIP
            })
            expect(builder.getDistance()).toBe(2000)
        })

        it('loop-close 모드이면 거리 + loopCloseDistance를 반환한다', () => {
            const builder = new RouteDraftBuilder({
                distance: 1000,
                closingMode: RouteClosingModeEnum.LOOP_CLOSE,
                loopCloseDistance: 200
            })
            expect(builder.getDistance()).toBe(1200)
        })

        it('loop-close 모드에서 loopCloseDistance가 없으면 거리만 반환한다', () => {
            const builder = new RouteDraftBuilder({
                distance: 1000,
                closingMode: RouteClosingModeEnum.LOOP_CLOSE
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
                        [127.1, 37.6, 45]
                    ]
                }
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
            .withPositions([
                [127.0, 37.5, 0],
                [127.1, 37.6, 0]
            ])
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
