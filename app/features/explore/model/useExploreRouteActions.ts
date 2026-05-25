import type { Ref } from 'vue'
import { useDistrictStore } from '~/entities/boundary/model/useDistrictStore'
import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

interface UseExploreRouteActionsOptions {
    activeNav: Ref<string>
    explore: any
    exploreSelectRoute: (routeId: string, title?: string) => Promise<void>
    sectionInfo: any
    routeList: { refresh: () => Promise<void> }
    notification: any
}

export const useExploreRouteActions = ({
    activeNav,
    explore,
    exploreSelectRoute,
    sectionInfo,
    routeList,
    notification
}: UseExploreRouteActionsOptions) => {
    const districtStore = useDistrictStore()
    const districtEffect = useDistrictSideeffect()

    /** 시군구 Select 옵션 */
    const sigunguOptions = computed(() => [FILTER_ALL, ...districtStore.guNames.value])

    /** 읍면동 Select 옵션 (선택된 시군구에 따라 동적 변경) */
    const dongOptions = computed(() => {
        if (explore.filter.selectedSigungu.value === FILTER_ALL) return [FILTER_ALL]
        return [FILTER_ALL, ...districtStore.getDongList(explore.filter.selectedSigungu.value)]
    })

    /** 탐색 결과에서 경로를 선택하면 지도 미리보기와 고도 차트를 표시한다. */
    const handleExploreSelect = async (routeId: string) => {
        explore.selectRoute(routeId)
        const route = explore.searchResults.value.find((r: any) => r.routeId === routeId)
        await exploreSelectRoute(routeId, route?.title)

        try {
            const sections = await explore.fetchSections(routeId)
            if (sections.length) {
                sectionInfo.open(routeId, sections as Parameters<typeof sectionInfo.open>[1], {
                    readOnly: true,
                    title: route?.title ?? '경로 미리보기'
                })
            }
        } catch (e) {
            console.error('[ExploreSelect] 구간 로드 실패:', e)
        }
    }

    /** 탐색 탭에서 경로를 가져오기(fork)한다. 중복 시 알림을 표시한다. */
    const handleExploreImport = async (routeId: string) => {
        try {
            await $fetch(`/api/routes/fork/${routeId}`, { method: 'POST' })
            await routeList.refresh()
            notification.notify({
                title: '경로 가져오기 완료',
                message: '내 경로 목록에 추가되었습니다.',
                tone: NotificationToneEnum.SUCCESS
            })
        } catch (e: any) {
            const message = e?.data?.message ?? '경로 가져오기에 실패했습니다.'
            notification.notify({
                title: '경로 가져오기',
                message,
                tone: NotificationToneEnum.WARNING
            })
        }
    }

    /** 탐색 탭 진입 시 공개 경로 자동 로드 (미로드 상태일 때만 실행) */
    watch(activeNav, (next) => {
        if (next !== '목록' && next !== '탐색') {
            sectionInfo.close()
        }
        if (
            next === '탐색' &&
            explore.searchResults.value.length === 0 &&
            !explore.isSearching.value
        ) {
            explore.search(explore.searchQuery.value)
        }
    })

    return {
        districtStore,
        districtEffect,
        sigunguOptions,
        dongOptions,
        handleExploreSelect,
        handleExploreImport
    }
}
