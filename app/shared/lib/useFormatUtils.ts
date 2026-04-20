/** 거리 값(km)을 m/km 단위 문자열로 변환한다. */
export const formatDistance = (distance?: number, fallback: string = ''): string => {
    if (typeof distance !== 'number' || Number.isNaN(distance)) return fallback
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}

/** 고도 값(m)을 소수점 1자리 문자열로 변환한다. */
export const formatElevation = (value?: number, fallback: string = '0.0m'): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback
    return `${value.toFixed(1)}m`
}
