import type { ShallowRef, Ref } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { createToggleLayerSideeffect } from '~/shared/lib/map/createToggleLayerSideeffect'
import {
    ELEVATION_ENTRIES,
    ELEVATION_ALPHA
} from '~/features/elevation-layer/lib/useElevationBands'

interface ElevationLayerOptions {
    viewer: ShallowRef<CesiumViewer | null>
    isElevationVisible: Ref<boolean>
}

/**
 * Cesium Globe에 고도별 색상 재질을 적용하는 sideeffect composable.
 * 서울 고도 범위(5m~836m)를 파랑→초록→노랑→빨강 그라데이션으로 표현한다.
 */
export const useElevationLayerSideeffect = (options: ElevationLayerOptions) => {
    const { viewer, isElevationVisible } = options
    let originalMaterial: unknown = null

    const applyElevationMaterial = () => {
        const C = getCesiumRuntime()
        const v = viewer.value
        if (!v) return

        originalMaterial = v.scene.globe.material

        if (C.createElevationBandMaterial) {
            v.scene.globe.material = C.createElevationBandMaterial({
                scene: v.scene,
                layers: ELEVATION_ENTRIES.map((entry, i) => {
                    const next = ELEVATION_ENTRIES[i + 1]
                    return {
                        entries: [
                            {
                                height: entry.height,
                                color: C.Color.fromCssColorString(entry.color).withAlpha(
                                    ELEVATION_ALPHA
                                )
                            },
                            {
                                height: next?.height ?? entry.height + 50,
                                color: C.Color.fromCssColorString(
                                    next?.color ?? entry.color
                                ).withAlpha(ELEVATION_ALPHA)
                            }
                        ],
                        extendDownwards: i === 0,
                        extendUpwards: i === ELEVATION_ENTRIES.length - 1
                    }
                })
            })
        } else {
            v.scene.globe.material = C.Material.fromType('ElevationContour', {
                width: 2.0,
                spacing: 50.0,
                color: C.Color.YELLOW
            })
        }

        v.scene.globe.depthTestAgainstTerrain = true
    }

    const removeElevationMaterial = () => {
        const v = viewer.value
        if (!v) return
        v.scene.globe.material = originalMaterial as typeof v.scene.globe.material
        originalMaterial = null
    }

    const { init } = createToggleLayerSideeffect({
        source: isElevationVisible,
        apply: applyElevationMaterial,
        remove: removeElevationMaterial
    })

    return { init }
}
