/**
 * 카메라 상태를 관리하는 store composable.
 * Cesium 뷰어의 카메라 위치·방향 정보와 역지오코딩 결과를 보관한다.
 */
export const useCameraStore = () => {
    /** 화면 중심의 위도 */
    const centerLat = useState<number | null>('camera.centerLat', () => null)
    /** 화면 중심의 경도 */
    const centerLng = useState<number | null>('camera.centerLng', () => null)
    /** 카메라 고도 (미터) */
    const altitude = useState<number | null>('camera.altitude', () => null)
    /** 카메라 방위각 (도, 0~360) */
    const heading = useState<number | null>('camera.heading', () => null)
    /** 카메라 기울기 (도, 0~90) */
    const pitch = useState<number | null>('camera.pitch', () => null)
    /** 역지오코딩된 행정구역 이름 (예: 서울특별시 강남구 역삼동) */
    const locationLabel = useState<string>('camera.locationLabel', () => '')

    /** 고도를 단위 포함 문자열로 변환한다 (1000m 이상이면 km) */
    const altitudeLabel = computed<string>(() => {
        const alt = altitude.value
        if (alt === null) return '-'
        if (alt >= 1000) return `${(alt / 1000).toFixed(2)}km`
        return `${Math.round(alt)}m`
    })

    /** footer에 표시할 전체 문자열 */
    const footerLabel = computed<string>(() => {
        const loc = locationLabel.value || '-'
        const alt = altitudeLabel.value
        const hdg = heading.value !== null ? `${Math.round(heading.value)}°` : '-'
        const ptch = pitch.value !== null ? `${Math.round(Math.abs(pitch.value))}°` : '-'
        return `${loc} | 고도: ${alt} 방위각: ${hdg} 기울기: ${ptch}`
    })

    return {
        centerLat,
        centerLng,
        altitude,
        heading,
        pitch,
        locationLabel,
        altitudeLabel,
        footerLabel
    }
}
