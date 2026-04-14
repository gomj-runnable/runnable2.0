import { distance, point } from '@turf/turf'
import type { DrawActionData } from '~/composables/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteElevationProfile } from '#shared/types/route'
import { RouteDraftBuilder } from '#shared/schemas/route.schema'
import type { SectionPointRange } from '~/composables/action/useRouteDrawDraft'
import type { SavedRoute } from '#shared/types/route'
import type { PoiDraftInput } from '#shared/types/facility'
import { useRouteClosingStore } from '~/composables/store/useRouteClosingStore'

/**
 * 경로 드로잉 화면 전반의 공유 상태를 관리하는 store composable.
 * 지도 드로잉 결과(포인트·측정값), 구간 초안, 저장 모달 개폐 여부, 경로 폼 입력값을 보유한다.
 * 상태 변경 로직(이벤트 핸들러)은 `useRouteDrawSideeffect`에 위임하고,
 * 이 store는 상태 노출과 초기화만 담당한다.
 */
export const useRouteDrawStore = () => {
    const closingStore = useRouteClosingStore()

    /** 사이드바 경로 목록의 검색 입력값 */
    const searchQuery = ref('')

    /** 현재 활성화된 사이드바 탭 이름 */
    const activeNav = ref('목록')

    /** 지도 드로잉 완료 후 저장된 경도/위도/고도 포인트 배열. 드로잉 전이면 `null`. */
    const drawnPositions = ref<GeoJsonPosition[] | null>(null)

    /** 지도 드로잉 완료 후 저장된 거리·면적 등 측정값. 드로잉 전이면 `null`. */
    const drawMetrics = ref<DrawActionData | null>(null)

    /** 현재 편집 중인 구간 초안. 드로잉 완료 시 생성되고, 저장 완료 또는 리셋 시 `null`로 초기화된다. */
    const sectionDraft = ref<CreateSectionSchema | null>(null)

    /** 각 구간이 담당하는 포인트 인덱스 범위 배열. 구간 추가·삭제 시 갱신된다. */
    const sectionPointRanges = ref<SectionPointRange[]>([])
    /** 구간 인덱스별 연결된 POI 배열. key = 구간 인덱스 */
    const sectionPois = ref<Record<number, PoiDraftInput[]>>({})
    /** 현재 POI 연결 대상 구간 인덱스. null이면 POI 클릭 시 연결 비활성 */
    const activeSectionIndex = ref<number | null>(null)

    /** 저장된 경로 목록 */
    const routes = ref<SavedRoute[]>([])

    /** 목록에서 현재 선택된 경로 ID */
    const selectedRouteId = ref<string | null>(null)

    /** 저장 모달(RouteSaveModal)의 열림 상태 */
    const isRouteSaveModalOpen = ref(false)

    /** 지도 내부 고도 그래프 모달 열림 상태 */
    const isElevationChartOpen = ref(false)

    /** 현재 표시 중인 고도 그래프 제목 */
    const elevationChartTitle = ref('경로 고도 그래프')

    /** 현재 표시 중인 거리-고도 프로필 데이터 */
    const elevationProfile = ref<RouteElevationProfile | null>(null)

    /** 저장 모달에서 입력하는 경로 제목과 설명 */
    const routeForm = ref({
        title: '',
        description: ''
    })

    /**
     * loop-close 모드에서 마지막 포인트 → 첫 포인트 간 거리 (meters).
     */
    const loopCloseDistance = computed(() => {
        const positions = drawnPositions.value
        if (!positions || positions.length < 2) return 0

        const first = positions[0]!
        const last = positions[positions.length - 1]!

        return distance(point([first[0], first[1]]), point([last[0], last[1]]), { units: 'meters' })
    })

    /**
     * `drawMetrics`에서 추출한 경로 총 거리 (meters 단위).
     * closingMode에 따라 왕복(×2) 또는 도착지 연결(+loopCloseDistance)이 적용된다.
     * `drawMetrics`가 없거나 거리 값이 유효하지 않으면 `undefined`를 반환한다.
     */
    const routeDistance = computed(() =>
        new RouteDraftBuilder({
            ...drawMetrics.value,
            closingMode: closingStore.closingMode.value,
            loopCloseDistance: loopCloseDistance.value
        }).getDistance()
    )

    /**
     * 드로잉 관련 모든 상태를 초기값으로 되돌린다.
     * 새 경로 드로잉을 시작하거나 저장을 취소할 때 호출한다.
     */
    const resetRouteDrawState = () => {
        drawnPositions.value = null
        drawMetrics.value = null
        sectionDraft.value = null
        sectionPointRanges.value = []
        sectionPois.value = {}
        activeSectionIndex.value = null
        isRouteSaveModalOpen.value = false
        isElevationChartOpen.value = false
        closingStore.resetClosingMode()
        elevationChartTitle.value = '경로 고도 그래프'
        elevationProfile.value = null
        routeForm.value = {
            title: '',
            description: ''
        }
    }

    return {
        searchQuery,
        activeNav,
        routes,
        selectedRouteId,
        drawnPositions,
        drawMetrics,
        sectionDraft,
        sectionPointRanges,
        sectionPois,
        activeSectionIndex,
        isRouteSaveModalOpen,
        isElevationChartOpen,
        elevationChartTitle,
        elevationProfile,
        routeForm,
        routeDistance,
        resetRouteDrawState,
        closingMode: closingStore.closingMode,
        isLoopClose: closingStore.isLoopClose,
        isRoundTrip: closingStore.isRoundTrip,
        setClosingMode: closingStore.setClosingMode,
        resetClosingMode: closingStore.resetClosingMode
    }
}
