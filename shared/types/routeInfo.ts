import type { Facility } from '#shared/types/facility'

export type RouteInfoDraftInput = Pick<Facility, 'name'> & { description: string } & {
    lng: number
    lat: number
    elevation?: number
}

export interface SavedRouteInfo extends RouteInfoDraftInput {
    routeInfoId: string
    routeId: string
    userId: string
    authorName: string
    createdAt?: string
}
