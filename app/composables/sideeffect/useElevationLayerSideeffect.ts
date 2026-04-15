import type { ShallowRef, Ref } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'

interface ElevationLayerOptions {
    viewer: ShallowRef<CesiumViewer | null>
    isElevationVisible: Ref<boolean>
}

/**
 * Cesium Globe에 고도별 색상 재질을 적용하는 sideeffect composable.
 * 서울 고도 범위(5m~836m)를 파랑→초록→노랑→빨강 그라데이션으로 표현한다.
 * isElevationVisible이 true이면 고도 재질을 적용하고, false이면 원래 재질로 복원한다.
 *
 * @param options - 뷰어와 고도 레이어 표시 여부 ref를 포함한 의존성 옵션
 */
export const useElevationLayerSideeffect = (options: ElevationLayerOptions) => {
    const { viewer, isElevationVisible } = options
    let originalMaterial: unknown = null

    // 서울 고도 범위
    const SEOUL_MIN = 5 // 한강 하류
    const SEOUL_MAX = 836 // 북한산 백운대

    const ELEVATION_ENTRIES = [
        { height: SEOUL_MIN, color: '#0000FF' }, // 파랑 (최저)
        { height: 100, color: '#0066FF' },
        { height: 200, color: '#00CC00' }, // 초록
        { height: 300, color: '#66FF00' },
        { height: 400, color: '#FFFF00' }, // 노랑
        { height: 500, color: '#FFAA00' },
        { height: 600, color: '#FF6600' }, // 주황
        { height: 700, color: '#FF3300' },
        { height: SEOUL_MAX, color: '#FF0000' } // 빨강 (최고)
    ]

    const applyElevationMaterial = () => {
        const C = window.Cesium
        const v = viewer.value
        if (!C || !v) return

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
                                color: C.Color.fromCssColorString(entry.color)
                            },
                            {
                                height: next?.height ?? entry.height + 50,
                                color: C.Color.fromCssColorString(next?.color ?? entry.color)
                            }
                        ],
                        extendDownwards: i === 0,
                        extendUpwards: i === ELEVATION_ENTRIES.length - 1
                    }
                })
            })
        } else {
            // 폴백: ElevationContour 재질로 고도 등고선 표시
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

    const init = () => {
        watch(
            isElevationVisible,
            (visible) => {
                if (visible) {
                    applyElevationMaterial()
                } else {
                    removeElevationMaterial()
                }
            },
            { immediate: true }
        )
    }

    return { init }
}
