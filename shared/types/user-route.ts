export type { UserPace, CreateUserPaceInput } from '#shared/schemas/user-route.schema'

export interface UserRoute {
    userRouteId: string
    userId: string
    categoryId: string
    routeId: string
}
