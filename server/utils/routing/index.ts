import type { RoutingServiceConfig } from './registry'
import { getRoutingService } from './registry'

// 서비스 자가 등록을 위한 사이드 이펙트 import
import './tmap.service'
import './osrm.service'

export type { RoutingServiceConfig }
export { getRoutingService as createRoutingService }
