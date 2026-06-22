import { describe, it, expect, vi, beforeEach } from 'vitest'

// createClampedPolyline / getSectionColor 의존 import 는 그대로 둠 (Cesium 만 stub).
import { useShareViewerSideeffect } from '~/features/share-viewer/api/useShareViewerSideeffect'
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'

// viewer 소유권은 CesiumController(useMapViewer)에 있다. 테스트는 공유 ref 를 직접 제어한다.
vi.mock('~/shared/lib/cesium/getters/useMapViewer', async () => {
    const { shallowRef } = await import('vue')
    const viewer = shallowRef<unknown>(null)
    return {
        useMapViewer: () => ({
            viewer,
            setViewer: (v: unknown) => {
                viewer.value = v
            }
        })
    }
})

const { setViewer: setMockViewer } = useMapViewer() as unknown as {
    setViewer: (v: unknown) => void
}

// Cesium runtime stub
const C = {
    Color: { fromCssColorString: (s: string) => ({ css: s }) },
    Cartesian3: { fromDegrees: (lng: number, lat: number, alt: number) => ({ lng, lat, alt }) },
    BoundingSphere: { fromPoints: (pts: unknown[]) => ({ pts }) },
    HeadingPitchRange: function (h: number, p: number, r: number) {
        return { h, p, r }
    } as any
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => {
    const entities: any[] = []
    return {
        entities: {
            add: (opts: any) => {
                const e = { ...opts, show: true }
                entities.push(e)
                return e
            },
            remove: (e: any) => {
                const i = entities.indexOf(e)
                if (i >= 0) entities.splice(i, 1)
            },
            list: entities
        },
        camera: {
            flyToBoundingSphere: vi.fn()
        }
    }
}

describe('useShareViewerSideeffect.renderSections()', () => {
    let viewer: ReturnType<typeof makeViewer>

    beforeEach(() => {
        setMockViewer(null)
        viewer = makeViewer()
        setMockViewer(viewer as any)
    })

    it('viewer 가 null 이면 무동작', () => {
        setMockViewer(null)
        const { renderSections } = useShareViewerSideeffect()
        expect(() => renderSections([])).not.toThrow()
    })

    it('비어 있거나 좌표 < 2 인 section 은 스킵', () => {
        const { renderSections } = useShareViewerSideeffect()
        renderSections([
            {
                geom: { type: 'LineString', coordinates: [[127, 37, 0]] },
                attrs: [],
                pois: []
            } as any
        ])
        expect((viewer.entities as any).list).toHaveLength(0)
        expect(viewer.camera.flyToBoundingSphere).not.toHaveBeenCalled()
    })

    it('좌표 ≥ 2 인 section 은 entity 추가 + camera flyToBoundingSphere 호출', () => {
        const { renderSections } = useShareViewerSideeffect()
        renderSections([
            {
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127.0, 37.0, 50],
                        [127.001, 37.001, 60]
                    ]
                },
                attrs: [],
                pois: []
            } as any
        ])

        expect((viewer.entities as any).list).toHaveLength(1)
        expect(viewer.camera.flyToBoundingSphere).toHaveBeenCalledOnce()
    })

    it('clear — 추가된 entity 모두 제거', () => {
        const { renderSections, clear } = useShareViewerSideeffect()
        renderSections([
            {
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127, 37, 0],
                        [127.001, 37, 0]
                    ]
                },
                attrs: [],
                pois: []
            } as any
        ])
        clear()
        expect((viewer.entities as any).list).toHaveLength(0)
    })
})
