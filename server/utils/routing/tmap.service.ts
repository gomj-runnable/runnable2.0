import type { GeoJsonPosition } from '#shared/types/geojson'
import { AbstractRoutingService, toCoordString } from './common'
import type { RoutingServiceConfig } from './registry'

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

export class TMapRoutingService extends AbstractRoutingService {
    private readonly apiKey: string

    constructor(apiKey: string) {
        super()
        this.apiKey = apiKey
    }

    isAvailable(): boolean {
        return !!this.apiKey
    }

    protected async callApi(positions: GeoJsonPosition[]): Promise<Response> {
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
            searchOption: 0
        }

        if (waypoints.length > 0) {
            body.passList = waypoints.map(toCoordString).join('_')
        }

        return fetch(TMAP_PEDESTRIAN_URL, {
            method: 'POST',
            headers: {
                appKey: this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
    }

    protected parseCoords(data: unknown): [number, number][] {
        const response = data as TMapResponse
        if (!response?.features) return []

        const coords: [number, number][] = []

        for (const feature of response.features) {
            if (feature.geometry.type === 'LineString') {
                coords.push(...(feature.geometry.coordinates as [number, number][]))
            }
        }

        return coords
    }
}

/** TMap 서비스 팩토리. 핸들러에서 직접 등록에 사용. */
export const tmapServiceFactory = (config: RoutingServiceConfig) =>
    new TMapRoutingService(config.tmapApi ?? '')
