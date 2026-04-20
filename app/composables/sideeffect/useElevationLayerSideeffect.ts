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

    // ─── 정규분포 기반 고도 구간 생성 ────────────────────────────────
    // 서울 고도 분포는 저지대(한강 유역)에 면적이 집중된 정규분포 형태.
    // CDF를 역변환하여 평균 고도 부근에 색상 해상도를 집중시킨다.

    const SEOUL_ELEVATION_MEAN = 55 // 서울 평균 고도 추정치 (m)
    const SEOUL_ELEVATION_STDDEV = 45 // 표준편차 — 작을수록 평균 부근에 색상 집중
    const ELEVATION_ALPHA = 0.3 // 색상 투명도 (0: 투명, 1: 불투명)

    /** 정규분포 CDF 근사 (Abramowitz & Stegun 26.2.17) */
    const normalCDF = (x: number): number => {
        const abs = Math.abs(x)
        const t = 1 / (1 + 0.2316419 * abs)
        const d = 0.3989423 * Math.exp(-x * x / 2)
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
        return x >= 0 ? 1 - p : p
    }

    /** 역정규분포 CDF 근사 (Abramowitz & Stegun 26.2.23) */
    const inverseNormalCDF = (p: number): number => {
        if (p <= 0) return -8
        if (p >= 1) return 8

        const a = p < 0.5 ? p : 1 - p
        const t = Math.sqrt(-2 * Math.log(a))
        const z = t - (2.515517 + 0.802853 * t + 0.010328 * t * t)
            / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t)
        return p < 0.5 ? -z : z
    }

    /**
     * 정규분포 CDF 역변환으로 고도 구간 경계를 생성한다.
     * 색상 공간에서 등간격인 지점들을 정규분포 역변환하여
     * 평균 고도 부근에 구간이 밀집되고, 극단 고도에서는 희소해진다.
     */
    const generateNormalStops = (count: number): number[] => {
        const cdfMin = normalCDF((SEOUL_MIN - SEOUL_ELEVATION_MEAN) / SEOUL_ELEVATION_STDDEV)
        const cdfMax = normalCDF((SEOUL_MAX - SEOUL_ELEVATION_MEAN) / SEOUL_ELEVATION_STDDEV)

        return Array.from({ length: count }, (_, i) => {
            if (i === 0) return SEOUL_MIN
            if (i === count - 1) return SEOUL_MAX

            const p = cdfMin + (cdfMax - cdfMin) * (i / (count - 1))
            const z = inverseNormalCDF(p)
            return Math.round(SEOUL_ELEVATION_MEAN + SEOUL_ELEVATION_STDDEV * z)
        })
    }

    const ELEVATION_COLORS = [
        '#0000FF', // 파랑 (최저)
        '#0066FF',
        '#00CC00', // 초록
        '#66FF00',
        '#FFFF00', // 노랑
        '#FFAA00',
        '#FF6600', // 주황
        '#FF3300',
        '#FF0000' // 빨강 (최고)
    ]

    const ELEVATION_ENTRIES = generateNormalStops(ELEVATION_COLORS.length)
        .map((height, i) => ({ height, color: ELEVATION_COLORS[i]! }))

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
                                color: C.Color.fromCssColorString(entry.color).withAlpha(ELEVATION_ALPHA)
                            },
                            {
                                height: next?.height ?? entry.height + 50,
                                color: C.Color.fromCssColorString(next?.color ?? entry.color).withAlpha(ELEVATION_ALPHA)
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
        const stopWatch = watch(
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

        onBeforeUnmount(() => {
            stopWatch()
        })
    }

    return { init }
}
