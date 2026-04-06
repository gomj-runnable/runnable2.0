import type { DrawActionData, MapPrimePosition } from '~/composables/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import { RouteDraftBuilder } from '#shared/schemas/route.schema'
import type { SectionPointRange } from '~/composables/action/useRouteDrawDraft'

/**
 * 경로 드로잉 화면 전반의 공유 상태를 관리하는 store composable.
 * 지도 드로잉 결과(포인트·측정값), 구간 초안, 저장 모달 개폐 여부, 경로 폼 입력값을 보유한다.
 * 상태 변경 로직(이벤트 핸들러)은 `useRouteDrawSideeffect`에 위임하고,
 * 이 store는 상태 노출과 초기화만 담당한다.
 */
export const useRouteDrawStore = () => {
    /** 사이드바 경로 목록의 검색 입력값 */
    const searchQuery = ref('')

    /** 현재 활성화된 사이드바 탭 이름 */
    const activeNav = ref('목록')

    /** 지도 드로잉 완료 후 저장된 MapPrime 내부 3D 포인트 배열. 드로잉 전이면 `null`. */
    const drawnPositions = ref<MapPrimePosition[] | null>(null)

    /** 지도 드로잉 완료 후 저장된 거리·면적 등 측정값. 드로잉 전이면 `null`. */
    const drawMetrics = ref<DrawActionData | null>(null)

    /** 현재 편집 중인 구간 초안. 드로잉 완료 시 생성되고, 저장 완료 또는 리셋 시 `null`로 초기화된다. */
    const sectionDraft = ref<CreateSectionSchema | null>(null)

    /** 각 구간이 담당하는 포인트 인덱스 범위 배열. 구간 추가·삭제 시 갱신된다. */
    const sectionPointRanges = ref<SectionPointRange[]>([])

    /** 저장 모달(RouteSaveModal)의 열림 상태 */
    const isRouteSaveModalOpen = ref(false)

    /** 저장 모달에서 입력하는 경로 제목과 설명 */
    const routeForm = ref({
        title: '',
        description: ''
    })

    /**
     * `drawMetrics`에서 추출한 경로 총 거리 (km 단위).
     * `drawMetrics`가 없거나 거리 값이 유효하지 않으면 `undefined`를 반환한다.
     */
    const routeDistance = computed(() => new RouteDraftBuilder(drawMetrics.value).getDistance())

    /**
     * 드로잉 관련 모든 상태를 초기값으로 되돌린다.
     * 새 경로 드로잉을 시작하거나 저장을 취소할 때 호출한다.
     */
    const resetRouteDrawState = () => {
        drawnPositions.value = null
        drawMetrics.value = null
        sectionDraft.value = null
        sectionPointRanges.value = []
        isRouteSaveModalOpen.value = false
        routeForm.value = {
            title: '',
            description: ''
        }
    }

    return {
        searchQuery,
        activeNav,
        drawnPositions,
        drawMetrics,
        sectionDraft,
        sectionPointRanges,
        isRouteSaveModalOpen,
        routeForm,
        routeDistance,
        resetRouteDrawState
    }
}
