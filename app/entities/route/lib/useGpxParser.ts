import type { GeoJsonPosition } from '#shared/types/geojson'

/**
 * GPX 1.1 XML 문자열을 파싱하여 GeoJSON 포인트 배열로 변환한다.
 * `<trkpt>` 요소를 순서대로 읽고, 여러 `<trkseg>`가 있으면 하나로 합친다.
 * `<ele>` 요소가 없거나 파싱 불가 시 고도는 0으로 처리한다.
 *
 * @param xml - GPX 형식의 XML 문자열
 * @returns `[longitude, latitude, elevation]` 형식의 포인트 배열
 */
export function parseGpxToPositions(xml: string): GeoJsonPosition[] {
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return []

    const positions: GeoJsonPosition[] = []

    for (const pt of Array.from(doc.querySelectorAll('trkpt'))) {
        const lat = parseFloat(pt.getAttribute('lat') ?? '')
        const lon = parseFloat(pt.getAttribute('lon') ?? '')
        if (isNaN(lat) || isNaN(lon)) continue

        const eleText = pt.querySelector('ele')?.textContent
        const ele = eleText ? parseFloat(eleText) : 0

        positions.push([lon, lat, isNaN(ele) ? 0 : ele])
    }

    return positions
}
