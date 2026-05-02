import { formatDistance } from '~/shared/lib/useFormatUtils'

interface RouteInfoLike {
    distance?: number
    highHeight?: number
    lowHeight?: number
    sgg?: string[]
}

/** 경로 정보를 key-value 배열로 변환한다 (UScrollArea 렌더링용) */
export function getRouteInfoItems(route: RouteInfoLike): { key: string; value: string }[] {
    const items: { key: string; value: string }[] = []
    if (route.distance) items.push({ key: '거리', value: formatDistance(route.distance) })
    if (route.highHeight)
        items.push({ key: '최고 고도', value: `${Math.round(route.highHeight)}m` })
    if (route.lowHeight) items.push({ key: '최저 고도', value: `${Math.round(route.lowHeight)}m` })
    if (route.sgg?.length) items.push({ key: '지역', value: route.sgg.join(' · ') })
    return items
}
