import { RouteOptimizeRequestBody, RouteOptimizeResponseBody } from '#shared/schemas/route-optimization.schema'

// Side-effect: 라우팅 서비스를 registry에 등록한다.
// index.ts에 두면 Nuxt auto-import가 export 없는 파일을 실행하지 않으므로 핸들러에서 직접 import.
import '~/server/utils/routing/tmap.service'
import '~/server/utils/routing/osrm.service'

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
