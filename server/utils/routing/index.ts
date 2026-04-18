import type { RoutingService } from './common'
import type { RouteOptimizationMode } from '#shared/types/route-optimization'
import type { RoutingServiceConfig } from './registry'
import { TMapRoutingService } from './tmap.service'
import { OsrmRoutingService } from './osrm.service'

export const createRoutingService = (
  mode: RouteOptimizationMode,
  config: RoutingServiceConfig = {}
): RoutingService | null => {
  switch (mode) {
    case 'TMAP':
      return new TMapRoutingService(config.tmapApi ?? '')
    case 'OSRM':
      return new OsrmRoutingService()
    default:
      return null
  }
}
