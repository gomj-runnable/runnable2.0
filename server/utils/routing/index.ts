// Side-effect imports: trigger self-registration in registry
import './tmap.service'
import './osrm.service'

export { getRoutingService, registerRoutingService } from './registry'
export type { RoutingServiceConfig, RoutingServiceFactory } from './registry'
export type { RoutingService } from './common'
