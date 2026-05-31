// 경로와 구간 데이터를 GPX 1.1 XML 문자열로 직렬화하는 유틸리티.
import type { RouteBase, RouteSectionBase } from '#shared/types/route'

/** GPX XML 파일의 표준 선언 헤더 */
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'
type GpxRouteSource = Pick<RouteBase, 'title' | 'description'>
type GpxSectionSource = Pick<RouteSectionBase, 'geom' | 'attrs'>

const escapeXml = (value?: string) =>
    (value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')

const toIsoTimestamp = () => new Date().toISOString()

const toTrackPoint = ([longitude, latitude, elevation]: [number, number, number]) => `\
<trkpt lat="${latitude}" lon="${longitude}">\
<ele>${elevation}</ele>\
</trkpt>`

const toTrackSegment = (section: GpxSectionSource, index: number) => {
    const points = (section.geom?.coordinates ?? []) as [number, number, number][]

    if (points.length === 0) {
        return ''
    }

    const name = section.attrs?.[0]?.name || `구간 ${index + 1}`

    return `\
<trkseg>\
<extensions><sectionName>${escapeXml(name)}</sectionName></extensions>\
${points.map(toTrackPoint).join('')}\
</trkseg>`
}

/**
 * 경로와 구간 목록으로 GPX 형식의 XML 문자열을 생성한다.
 * 각 구간은 `<trkseg>`으로 변환되며 구간명을 `<extensions>`에 포함한다.
 *
 * @param route - 경로 제목·설명을 포함한 소스 객체
 * @param sections - GPX 트랙 세그먼트로 변환할 구간 배열
 * @returns GPX 1.1 형식의 XML 문자열
 */
export const createRouteGpx = (
    route: GpxRouteSource,
    sections: GpxSectionSource[]
) => `${XML_HEADER}
<gpx version="1.1" creator="Runnable" xmlns="http://www.topografix.com/GPX/1/1">
<metadata>
<name>${escapeXml(route.title)}</name>
${route.description ? `<desc>${escapeXml(route.description)}</desc>` : ''}
<time>${toIsoTimestamp()}</time>
</metadata>
<trk>
<name>${escapeXml(route.title)}</name>
${route.description ? `<desc>${escapeXml(route.description)}</desc>` : ''}
${sections.map(toTrackSegment).join('')}
</trk>
</gpx>`

/**
 * 경로 제목을 파일 시스템에 안전한 GPX 파일명으로 변환한다.
 * 특수문자와 공백을 `-`로 치환하고, 제목이 없으면 `'route-draft.gpx'`를 반환한다.
 *
 * @param title - 경로 제목 문자열. 없으면 기본 파일명을 사용한다.
 * @returns `.gpx` 확장자를 포함한 안전한 파일명
 */
export const toGpxFileName = (title?: string) => {
    const baseName = (title || 'route-draft')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')

    return `${baseName || 'route-draft'}.gpx`
}
