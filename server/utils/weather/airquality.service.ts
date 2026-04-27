import type { WeatherSourceError } from '#shared/types/weather'
import { AirQualityAdapter } from './airquality.adapter'
import type { AirQualitySlot } from './airquality.adapter'

export interface AirQualityServiceResult {
    dataByGu: Map<string, AirQualitySlot[]>
    error: WeatherSourceError | null
}

export class AirQualityService {
    private readonly adapter = new AirQualityAdapter()

    async fetch(serviceKey: string): Promise<AirQualityServiceResult> {
        if (!serviceKey.trim()) {
            return { dataByGu: new Map(), error: null }
        }

        try {
            const dataByGu = await this.adapter.fetchSeoulAirQuality(serviceKey)
            return { dataByGu, error: null }
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e)
            console.error('[AirQualityService]', e)
            return { dataByGu: new Map(), error: { source: 'airquality', message } }
        }
    }
}
