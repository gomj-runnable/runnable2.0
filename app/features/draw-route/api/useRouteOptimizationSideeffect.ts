// 경로 좌표 배열을 서버 최적화 API로 보내고 결과를 반환하는 sideeffect composable.
import type { RouteOptimizationMode, RouteOptimizeResponse } from '#shared/types/route-optimization'
import { RouteOptimizationModeEnum } from '#shared/types/route-optimization-mode.enum'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { Ref } from 'vue'

interface UseRouteOptimizationOptions {
    isOptimizing: Ref<boolean>
}

/** 경로 좌표와 최적화 모드를 서버에 전송하고 최적화된 좌표를 반환한다. */
export const useRouteOptimizationSideeffect = (options: UseRouteOptimizationOptions) => {
    /** 서버 라우팅 모드일 때 API를 호출해 최적화 결과를 반환한다. 그 외 모드는 원본을 반환한다. */
    const optimizeRoute = async (
        positions: GeoJsonPosition[],
        mode: RouteOptimizationMode
    ): Promise<RouteOptimizeResponse> => {
        if (!RouteOptimizationModeEnum.from(mode).isServerRouted) {
            return { positions, mode, optimized: false }
        }

        options.isOptimizing.value = true
        try {
            return await $fetch<RouteOptimizeResponse>('/api/routes/optimize', {
                method: 'POST',
                body: { positions, mode }
            })
        } catch {
            return {
                positions,
                mode,
                optimized: false,
                message: '경로 최적화 요청에 실패했습니다.'
            }
        } finally {
            options.isOptimizing.value = false
        }
    }

    return { optimizeRoute }
}
