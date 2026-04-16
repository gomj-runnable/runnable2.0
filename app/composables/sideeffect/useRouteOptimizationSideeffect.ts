import {
  type RouteOptimizationMode,
  type RouteOptimizeResponse,
  isServerRoutedMode
} from '#shared/types/route-optimization'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { Ref } from 'vue'

interface UseRouteOptimizationOptions {
  isOptimizing: Ref<boolean>
}

export const useRouteOptimizationSideeffect = (options: UseRouteOptimizationOptions) => {
  const optimizeRoute = async (
    positions: GeoJsonPosition[],
    mode: RouteOptimizationMode
  ): Promise<RouteOptimizeResponse> => {
    if (!isServerRoutedMode(mode)) {
      return { positions, mode, optimized: false }
    }

    options.isOptimizing.value = true
    try {
      return await $fetch<RouteOptimizeResponse>('/api/routes/optimize', {
        method: 'POST',
        body: { positions, mode }
      })
    } catch {
      return { positions, mode, optimized: false, message: '경로 최적화 요청에 실패했습니다.' }
    } finally {
      options.isOptimizing.value = false
    }
  }

  return { optimizeRoute }
}
