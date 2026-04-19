export interface RouteInfoBase {
    name: string
    description: string
    longitude: number
    latitude: number
    elevation?: number
}

export interface SavedRouteInfo extends RouteInfoBase {
    routeInfoId: string
    routeId: string
    userId: string
    authorName: string
    createdAt?: string
}

export type RouteInfoDraftInput = RouteInfoBase
