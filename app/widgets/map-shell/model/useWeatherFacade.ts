import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useWeatherStore } from '~/entities/weather/model/useWeatherStore'
import { useWeatherSideeffect } from '~/features/weather-overlay/api/useWeatherSideeffect'
import { useWeatherSourceStrategy } from '~/entities/weather/model/useWeatherSourceStrategy'
import { useWeatherRecommendStore } from '~/entities/weather/model/useWeatherRecommendStore'
import { useWeatherRecommendSideeffect } from '~/features/weather-overlay/api/useWeatherRecommendSideeffect'

interface UseWeatherFacadeOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

export function useWeatherFacade({ viewer }: UseWeatherFacadeOptions) {
    const weather = useWeatherStore()
    const weatherSources = useWeatherSourceStrategy()
    const { init: initWeather } = useWeatherSideeffect({ viewer, ...weather })

    watch(weather.activeLayer, (layer) => weatherSources.syncSourceFromLayer(layer))

    const weatherRecommend = useWeatherRecommendStore()
    const weatherRecommendEffect = useWeatherRecommendSideeffect()

    return { weather, weatherSources, initWeather, weatherRecommend, weatherRecommendEffect }
}
