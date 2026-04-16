import type { RouteOptimizationMode } from '#shared/types/route-optimization'
import type { RoutingService } from './common'

export interface RoutingServiceConfig {
  tmapApi?: string
}

export type RoutingServiceFactory = (config: RoutingServiceConfig) => RoutingService

const registry = new Map<RouteOptimizationMode, RoutingServiceFactory>()

/** 라우팅 서비스를 레지스트리에 등록한다 */
export const registerRoutingService = (
  mode: RouteOptimizationMode,
  factory: RoutingServiceFactory
): void => {
  registry.set(mode, factory)
}

/** 주어진 모드에 해당하는 라우팅 서비스를 반환한다. 미등록 모드는 null. */
export const getRoutingService = (
  mode: RouteOptimizationMode,
  config: RoutingServiceConfig = {}
): RoutingService | null => {
  const factory = registry.get(mode)
  return factory ? factory(config) : null
}
