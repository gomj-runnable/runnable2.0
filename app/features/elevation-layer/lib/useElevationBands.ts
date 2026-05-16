/**
 * 서울 고도 범위(5m~836m)에 대한 색상 밴드를 생성한다.
 * 정규분포 CDF 역변환으로 평균 고도 부근에 색상 해상도를 집중시킨다.
 */

const SEOUL_MIN = 5
const SEOUL_MAX = 836
const SEOUL_ELEVATION_MEAN = 55
const SEOUL_ELEVATION_STDDEV = 45
const ELEVATION_ALPHA = 0.3

const ELEVATION_COLORS = [
    '#0000FF',
    '#0066FF',
    '#00CC00',
    '#66FF00',
    '#FFFF00',
    '#FFAA00',
    '#FF6600',
    '#FF3300',
    '#FF0000'
]

/** 정규분포 CDF 근사 (Abramowitz & Stegun 26.2.17) */
const normalCDF = (x: number): number => {
    const abs = Math.abs(x)
    const t = 1 / (1 + 0.2316419 * abs)
    const d = 0.3989423 * Math.exp((-x * x) / 2)
    const p =
        d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return x >= 0 ? 1 - p : p
}

/** 역정규분포 CDF 근사 (Abramowitz & Stegun 26.2.23) */
const inverseNormalCDF = (p: number): number => {
    if (p <= 0) return -8
    if (p >= 1) return 8

    const a = p < 0.5 ? p : 1 - p
    const t = Math.sqrt(-2 * Math.log(a))
    const z =
        t -
        (2.515517 + 0.802853 * t + 0.010328 * t * t) /
            (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t)
    return p < 0.5 ? -z : z
}

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

export interface ElevationEntry {
    height: number
    color: string
}

/** 서울 고도 밴드 색상 엔트리 목록 */
export const ELEVATION_ENTRIES: ElevationEntry[] = generateNormalStops(ELEVATION_COLORS.length).map(
    (height, i) => ({ height, color: ELEVATION_COLORS[i]! })
)

/** 고도 밴드 투명도 */
export { ELEVATION_ALPHA }
