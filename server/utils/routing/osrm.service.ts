import type { GeoJsonPosition } from '#shared/types/geojson'
import { AbstractRoutingService } from './common'

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

/** OSRM 서비스 팩토리. 핸들러에서 직접 등록에 사용. */
export const osrmServiceFactory = () => new OsrmRoutingService()
