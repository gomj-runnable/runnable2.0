import type { HourlyWeather, WeatherSourceError } from '#shared/types/weather'
import { ForecastAdapter } from './forecast.adapter'

export interface ForecastServiceResult {
    slots: HourlyWeather[]
    error: WeatherSourceError | null
}

export class ForecastService {
    private readonly adapter = new ForecastAdapter()

    async fetch(
        serviceKey: string,
        requestedDate: string,
        now: Date = new Date()
    ): Promise<ForecastServiceResult> {
        if (!serviceKey.trim()) {
            return { slots: [], error: null }
        }

        try {
            const slots = await this.adapter.fetchSlots(serviceKey, requestedDate, now)
            return { slots, error: null }
        } catch (e) {
            console.error('[ForecastService]', e)
            return { slots: [], error: { source: 'forecast', message: '예보 데이터 조회 실패' } }
        }
    }
}
