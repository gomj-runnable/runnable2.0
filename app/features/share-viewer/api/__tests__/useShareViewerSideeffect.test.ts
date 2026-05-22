import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

// createClampedPolyline / getSectionColor 의존 import 는 그대로 둠 (Cesium 만 stub).
import { useShareViewerSideeffect } from '~/features/share-viewer/api/useShareViewerSideeffect'

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
    let viewer: ShallowRef<any>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
    })

    it('viewer 가 null 이면 무동작', () => {
        viewer.value = null
        const { renderSections } = useShareViewerSideeffect({ viewer })
        expect(() => renderSections([])).not.toThrow()
    })

    it('비어 있거나 좌표 < 2 인 section 은 스킵', () => {
        const { renderSections } = useShareViewerSideeffect({ viewer })
        renderSections([
            {
                geom: { type: 'LineString', coordinates: [[127, 37, 0]] },
                attrs: [],
                pois: []
            } as any
        ])
        expect((viewer.value.entities as any).list).toHaveLength(0)
        expect(viewer.value.camera.flyToBoundingSphere).not.toHaveBeenCalled()
    })

    it('좌표 ≥ 2 인 section 은 entity 추가 + camera flyToBoundingSphere 호출', () => {
        const { renderSections } = useShareViewerSideeffect({ viewer })
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

        expect((viewer.value.entities as any).list).toHaveLength(1)
        expect(viewer.value.camera.flyToBoundingSphere).toHaveBeenCalledOnce()
    })

    it('clear — 추가된 entity 모두 제거', () => {
        const { renderSections, clear } = useShareViewerSideeffect({ viewer })
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
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })
})
