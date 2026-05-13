import type { GeoJsonPosition } from '#shared/types/geojson'

const GPX_NS = 'http://www.topografix.com/GPX/1/1'

/**
 * GPX 1.1 XML 문자열을 파싱하여 GeoJSON 포인트 배열로 변환한다.
 * `<trkpt>` 요소를 순서대로 읽고, 여러 `<trkseg>`가 있으면 하나로 합친다.
 * `<trkpt>`가 없으면 `<rtept>`(루트 포인트)로 폴백한다.
 * `<ele>` 요소가 없거나 파싱 불가 시 고도는 0으로 처리한다.
 *
 * @param xml - GPX 형식의 XML 문자열
 * @returns `[longitude, latitude, elevation]` 형식의 포인트 배열
 */
export function parseGpxToPositions(xml: string): GeoJsonPosition[] {
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return []

    // GPX 1.1 네임스페이스로 먼저 조회하고, 없으면 querySelectorAll 폴백
    let pts = Array.from(doc.getElementsByTagNameNS(GPX_NS, 'trkpt'))
    if (pts.length === 0) pts = Array.from(doc.querySelectorAll('trkpt'))

    // trkpt가 없으면 rtept(루트 포인트)로 폴백
    if (pts.length === 0) {
        pts = Array.from(doc.getElementsByTagNameNS(GPX_NS, 'rtept'))
        if (pts.length === 0) pts = Array.from(doc.querySelectorAll('rtept'))
    }

    const positions: GeoJsonPosition[] = []

    for (const pt of pts) {
        const lat = parseFloat(pt.getAttribute('lat') ?? '')
        const lon = parseFloat(pt.getAttribute('lon') ?? '')
        if (isNaN(lat) || isNaN(lon)) continue

        const eleText = pt.querySelector('ele')?.textContent
        const ele = eleText ? parseFloat(eleText) : 0

        positions.push([lon, lat, isNaN(ele) ? 0 : ele])
    }

    return positions
}
