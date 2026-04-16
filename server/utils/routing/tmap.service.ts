import type { GeoJsonPosition } from '#shared/types/geojson'
import { type RoutingService, toCoordString, interpolateHeights } from './common'
import { registerRoutingService } from './registry'

const TMAP_PEDESTRIAN_URL = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1'

interface TMapFeature {
  geometry: {
    type: 'LineString' | 'Point'
    coordinates: [number, number][] | [number, number]
  }
}

interface TMapResponse {
  type: 'FeatureCollection'
  features: TMapFeature[]
}

export class TMapRoutingService implements RoutingService {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async optimize(positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]> {
    if (positions.length < 2) return positions

    const start = positions[0]!
    const end = positions[positions.length - 1]!
    const waypoints = positions.slice(1, -1)

    const body: Record<string, unknown> = {
      startX: start[0],
      startY: start[1],
      endX: end[0],
      endY: end[1],
      startName: '출발지',
      endName: '도착지',
      searchOption: 0,
    }

    if (waypoints.length > 0) {
      body.passList = waypoints.map(toCoordString).join('_')
    }

    const response = await fetch(TMAP_PEDESTRIAN_URL, {
      method: 'POST',
      headers: {
        appKey: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`TMap API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as TMapResponse

    const optimizedCoords: [number, number][] = []
    for (const feature of data.features) {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates as [number, number][]
        optimizedCoords.push(...coords)
      }
    }

    if (optimizedCoords.length === 0) return positions

    return interpolateHeights(positions, optimizedCoords)
  }
}

registerRoutingService('TMAP', (config) => new TMapRoutingService(config.tmapApi ?? ''))
