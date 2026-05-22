import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { SavedSection } from '#shared/types/route'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { createEntityGroup } from '~/shared/lib/map/useEntityCleanup'
import { geomToRouteDrawPositions, getSectionColor } from '~/entities/route/lib/useRouteDrawUtils'
import { createClampedPolyline } from '~/entities/route/lib/useGroundClamping'

interface UseShareViewerOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * 공유 페이지에서 경로 섹션을 읽기 전용으로 지도에 렌더링하는 sideeffect.
 * 폴리라인 엔티티를 추가하고 카메라를 경로에 맞게 이동한다.
 */
export const useShareViewerSideeffect = (options: UseShareViewerOptions) => {
    const polylines = createEntityGroup(options.viewer)

    const renderSections = (sections: SavedSection[]) => {
        const v = options.viewer.value
        if (!v) return

        polylines.clear()
        const C = getCesiumRuntime()

        const allPositions: ReturnType<typeof C.Cartesian3.fromDegrees>[] = []

        sections.forEach((section, i) => {
            const positions = geomToRouteDrawPositions(section.geom)
            if (positions.length < 2) return

            const color = getSectionColor(i)
            const entity = v.entities.add({
                polyline: createClampedPolyline(C, {
                    positions,
                    width: 4,
                    material: (
                        C as unknown as { Color: { fromCssColorString: (s: string) => any } }
                    ).Color.fromCssColorString(color)
                })
            })
            polylines.set([entity])

            for (const [lng, lat, alt] of positions) {
                if (lng !== undefined && lat !== undefined) {
                    allPositions.push(C.Cartesian3.fromDegrees(lng, lat, alt ?? 0))
                }
            }
        })

        if (allPositions.length > 0) {
            const CLib = C as unknown as {
                BoundingSphere: {
                    fromPoints: (pts: unknown[]) => unknown
                }
                HeadingPitchRange: new (h: number, p: number, r: number) => any
            }
            const sphere = CLib.BoundingSphere.fromPoints(allPositions)
            v.camera.flyToBoundingSphere(
                sphere as Parameters<typeof v.camera.flyToBoundingSphere>[0],
                {
                    offset: new CLib.HeadingPitchRange(0, -0.5, 0),
                    duration: 1.5
                }
            )
        }
    }

    const clear = () => polylines.clear()

    return { renderSections, clear }
}
