import type { HourlyWeather, WeatherSourceError } from '#shared/types/weather'
import { ObservedWeatherAdapter } from './observed.adapter'

export interface ObservedServiceResult {
    slots: HourlyWeather[]
    error: WeatherSourceError | null
}

export class ObservedService {
    private readonly adapter = new ObservedWeatherAdapter()

    async fetch(authKey: string, start: Date, end: Date): Promise<ObservedServiceResult> {
        if (!authKey.trim()) {
            return { slots: [], error: null }
        }

        try {
            const slots = await this.adapter.fetchSlots(authKey, start, end)
            return { slots, error: null }
        } catch (e) {
            console.error('[ObservedService]', e)
            return { slots: [], error: { source: 'observed', message: '관측 데이터 조회 실패' } }
        }
    }
}
