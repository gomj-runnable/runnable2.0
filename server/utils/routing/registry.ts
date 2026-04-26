import type { RouteOptimizationMode } from '#shared/types/route-optimization'
import type { RoutingService } from './common'
import { tmapServiceFactory } from './tmap.service'
import { osrmServiceFactory } from './osrm.service'

export interface RoutingServiceConfig {
  tmapApi?: string
}

export type RoutingServiceFactory = (config: RoutingServiceConfig) => RoutingService

/** 모드 → 팩토리 매핑. 서비스 추가 시 여기에 등록. */
const ROUTING_FACTORIES: Record<string, RoutingServiceFactory> = {
  TMAP: tmapServiceFactory,
  OSRM: osrmServiceFactory,
}

/** 주어진 모드에 해당하는 라우팅 서비스를 반환한다. 미등록 모드는 null. */
export const getRoutingService = (
  mode: RouteOptimizationMode,
  config: RoutingServiceConfig = {}
): RoutingService | null => {
  const factory = ROUTING_FACTORIES[mode]
  return factory ? factory(config) : null
}
