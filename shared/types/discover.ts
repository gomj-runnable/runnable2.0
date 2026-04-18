export interface RouteDiscoverFilter {
    district?: string
    sortBy?: 'distance' | 'elevation' | 'recent' | 'popular'
    limit?: number
}

export interface RouteDiscoverCard {
    routeId: string
    title: string
    distance?: number
    highHeight?: number
    lowHeight?: number
    districts?: string[]
    createdAt?: string
    authorName?: string
}
