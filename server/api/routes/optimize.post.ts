import { RouteOptimizeRequestBody, RouteOptimizeResponseBody } from '#shared/schemas/route-optimization.schema'

import { tmapServiceFactory } from '../../utils/routing/tmap.service'
import { osrmServiceFactory } from '../../utils/routing/osrm.service'

// 라우팅 서비스를 registry에 명시적 등록.
// Nitro가 side-effect-only import를 tree-shake하므로 export를 참조해야 실행된다.
registerRoutingService('TMAP', tmapServiceFactory)
registerRoutingService('OSRM', osrmServiceFactory)

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const raw = await readBody(event)
  const request = RouteOptimizeRequestBody.fromRaw(raw)
  const config = useRuntimeConfig()

  const service = getRoutingService(request.mode, { tmapApi: config.tmapApi as string })

  if (!service || !service.isAvailable()) {
    return RouteOptimizeResponseBody.fallback(
      request.positions,
      request.mode,
      service ? '서비스를 사용할 수 없습니다.' : '해당 모드는 서버 라우팅을 지원하지 않습니다.'
    )
  }

  try {
    const optimized = await service.optimize(request.positions)
    return RouteOptimizeResponseBody.success(optimized, request.mode)
  } catch (error) {
    return RouteOptimizeResponseBody.fallback(
      request.positions,
      request.mode,
      error instanceof Error ? error.message : '경로 최적화 중 오류가 발생했습니다.'
    )
  }
})
