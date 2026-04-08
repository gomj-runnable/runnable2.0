import type { CreateRouteSchema, CreateSectionSchema } from '#shared/schemas/route.schema'
import type { SavedRoute, SavedSection } from '#shared/types/route'

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'
type GpxRouteSource = Pick<CreateRouteSchema | SavedRoute, 'title' | 'description'>
type GpxSectionSource = Pick<CreateSectionSchema | SavedSection, 'geom' | 'attrs'>

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
    const points = section.geom?.coordinates ?? []

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

export const toGpxFileName = (title?: string) => {
    const baseName = (title || 'route-draft')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')

    return `${baseName || 'route-draft'}.gpx`
}
