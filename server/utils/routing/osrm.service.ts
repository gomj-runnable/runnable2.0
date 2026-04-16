import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RoutingService } from './common'
import { interpolateHeights } from './common'
import { registerRoutingService } from './registry'

interface OsrmResponse {
  code: string
  routes: Array<{
    geometry: { type: 'LineString'; coordinates: [number, number][] }
    distance: number
    duration: number
  }>
}

export class OsrmRoutingService implements RoutingService {
  private readonly baseUrl = 'https://router.project-osrm.org/route/v1/foot'

  isAvailable(): boolean {
    return true
  }

  async optimize(positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]> {
    if (positions.length < 2) {
      return positions
    }

    const coordinates = positions
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(';')

    const url = `${this.baseUrl}/${coordinates}?overview=full&geometries=geojson&steps=false`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        return positions
      }

      const data: OsrmResponse = await response.json()

      if (data.code !== 'Ok' || !data.routes.length) {
        return positions
      }

      const routedCoords = data.routes[0]!.geometry.coordinates
      const routed2D: [number, number][] = routedCoords.map(([lng, lat]) => [lng, lat])

      return interpolateHeights(positions, routed2D)
    } catch {
      return positions
    }
  }
}

registerRoutingService('OSRM', () => new OsrmRoutingService())
