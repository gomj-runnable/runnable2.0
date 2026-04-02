export interface UserRoute {
    userRouteId: string
    userId: string
    categoryId: string
    routeId: string
}

export interface UserPace {
    userPaceId: string
    userRouteId: string
    sectionId: string
    pace?: number // integer (초 단위)
    strategy?: string
}
