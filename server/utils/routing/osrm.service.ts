import type { GeoJsonPosition } from '#shared/types/geojson'
import { AbstractRoutingService } from './common'
import { registerRoutingService } from './registry'

interface OsrmResponse {
  code: string
  routes: Array<{
    geometry: { type: 'LineString'; coordinates: [number, number][] }
    distance: number
    duration: number
  }>
}

export class OsrmRoutingService extends AbstractRoutingService {
  private readonly baseUrl = 'https://router.project-osrm.org/route/v1/foot'

  isAvailable(): boolean {
    return true
  }

  /** OSRM은 외부 서비스이므로 실패 시 원본 좌표를 반환한다 (graceful degradation). */
  protected override onError(positions: GeoJsonPosition[]): GeoJsonPosition[] {
    return positions
  }

  protected async callApi(positions: GeoJsonPosition[]): Promise<Response> {
    const coordinates = positions
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(';')

    return fetch(`${this.baseUrl}/${coordinates}?overview=full&geometries=geojson&steps=false`)
  }

  protected parseCoords(data: unknown): [number, number][] {
    const response = data as OsrmResponse

    if (response.code !== 'Ok' || !response.routes.length) {
      return []
    }

    return response.routes[0]!.geometry.coordinates.map(([lng, lat]) => [lng, lat])
  }
}

registerRoutingService('OSRM', () => new OsrmRoutingService())
