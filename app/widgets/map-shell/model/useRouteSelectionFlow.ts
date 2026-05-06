import type { Ref } from 'vue'
import { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'
import type { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import type { useSimulationStore } from '~/features/simulation/model/useSimulationStore'
import type { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import {
    calculateTotalDistance,
    calculateTotalTime,
    calculateRangeDistance,
    formatTime
} from '~/entities/route/lib/usePaceCalculator'
import { NavKey } from '~/widgets/map-shell/model/nav-key'
import type { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'

interface UseRouteSelectionFlowOptions {
    routeDrawStore: ReturnType<typeof useRouteDrawStore>
    routeList: {
        select: (...args: any[]) => any
        selectedRouteId: string | null
        filteredRoutes: any[]
    }
    slideOver: { current: Ref<any>; meta: Ref<{ title: string; description: string }> }
    activeNav: Ref<string>
    simulation: {
        store: ReturnType<typeof useSimulationStore>
        effect: { stopPlayback: () => void }
    }
    routeInfoStore: ReturnType<typeof useRouteInfoStore>
    routeInfoEffect: ReturnType<typeof useRouteInfoSideeffect>
}

/**
 * 경로 선택·수정 흐름 및 구간 정보 메트릭을 관리하는 composable.
 *
 * index.vue의 구간 정보(sectionInfo), 슬라이드오버 제목/설명, 경로 선택/수정 핸들러,
 * 경로 변경 시 시뮬레이션 정지 로직을 캡슐화한다.
 */
export function useRouteSelectionFlow({
    routeDrawStore,
    routeList,
    slideOver,
    activeNav,
    simulation,
    routeInfoStore,
    routeInfoEffect
}: UseRouteSelectionFlowOptions) {
    const sectionInfo = useSectionInfoStore()

    // ─── 구간 거리 메트릭 ──────────────────────────────────────────

    const sectionDistances = computed(() => {
        const positions = routeDrawStore.drawnPositions.value
        const ranges = routeDrawStore.sectionPointRanges.value
        if (!positions?.length || !ranges.length) return []
        return ranges.map((range) => calculateRangeDistance(positions, range))
    })

    const sectionTotalDistance = computed(() => calculateTotalDistance(sectionInfo.sections.value))
    const sectionTotalTime = computed(() =>
        formatTime(calculateTotalTime(sectionInfo.sections.value, sectionInfo.userPaces.value))
    )

    // ─── Step 네비게이션 (경로목록 → 구간정보) ─────────────────────

    const showStepBackConfirm = ref(false)

    /** SlideOver 제목: 구간정보가 열려있으면 덮어쓴다 */
    const slideOverTitle = computed(() => {
        if (
            sectionInfo.isOpen.value &&
            (slideOver.current.value === NavKey.LIST || slideOver.current.value === NavKey.EXPLORE)
        ) {
            return sectionInfo.panelTitle.value
        }
        return slideOver.meta.value.title
    })

    const slideOverDescription = computed(() => {
        if (
            sectionInfo.isOpen.value &&
            (slideOver.current.value === NavKey.LIST || slideOver.current.value === NavKey.EXPLORE)
        ) {
            return '구간별 페이스·짐 무게·전략을 설정합니다'
        }
        return slideOver.meta.value.description
    })

    /** 구간정보 → 경로목록으로 돌아가기 (항상 경고) */
    const handleStepBack = () => {
        showStepBackConfirm.value = true
    }

    const confirmStepBack = () => {
        showStepBackConfirm.value = false
        sectionInfo.close()
    }

    // ─── 경로 선택·수정 핸들러 ─────────────────────────────────────

    /** 선택 경로가 바뀌면 기존 시뮬레이션을 즉시 정지한다. */
    const stopSimulationForRouteChange = () => {
        if (!simulation.store.playbackState.value.isStopped) {
            simulation.effect.stopPlayback()
        }
    }

    const handleRouteSelect = async (routeId: string) => {
        stopSimulationForRouteChange()
        const sections = await routeList.select(routeId)
        if (sections) {
            sectionInfo.open(routeId, sections as Parameters<typeof sectionInfo.open>[1])
        }
    }

    /** 목록에서 내 경로를 수정 모드로 열어 그리기 탭으로 전환한다 */
    const handleRouteEdit = async (routeId: string) => {
        stopSimulationForRouteChange()
        const sections = await routeList.select(routeId)
        if (!sections?.length) return

        const route = routeList.filteredRoutes.find((r: any) => r.routeId === routeId)
        routeDrawStore.editingRouteId.value = routeId
        routeDrawStore.routeForm.value = {
            title: route?.title ?? '',
            description: route?.description ?? ''
        }

        // 그리기 탭으로 전환 (드로잉은 시작하지 않음 - 기존 데이터로 로드)
        activeNav.value = '그리기'
    }

    // ─── 경로 선택/해제 시 경로정보 로드/정리 ─────────────────────

    watch(
        () => routeList.selectedRouteId,
        (routeId) => {
            if (routeId) {
                routeInfoEffect.fetchRouteInfos(routeId)
            } else {
                routeInfoStore.clearRouteInfos()
                routeInfoEffect.clearMarkers()
            }
        }
    )

    // 경로 폴리라인이 지워지면 로컬 경로정보도 함께 정리
    watch(
        () => routeDrawStore.drawnPositions.value,
        (positions) => {
            if (!positions) {
                routeInfoStore.clearLocalRouteInfos()
                routeInfoEffect.clearMarkers()
            }
        }
    )

    return {
        sectionInfo,
        sectionDistances,
        sectionTotalDistance,
        sectionTotalTime,
        showStepBackConfirm,
        slideOverTitle,
        slideOverDescription,
        handleStepBack,
        confirmStepBack,
        stopSimulationForRouteChange,
        handleRouteSelect,
        handleRouteEdit
    }
}
