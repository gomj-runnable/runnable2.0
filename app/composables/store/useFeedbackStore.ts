import type { SavedFeedback, FeedbackDraftInput } from '#shared/types/feedback'

/**
 * 경로 피드백 상태를 관리하는 store composable.
 * 서버 저장된 피드백(feedbacks)과 로컬 미저장 피드백(localFeedbacks)을 분리 관리한다.
 */
export const useFeedbackStore = () => {
    /** 서버에서 불러온 저장된 피드백 목록 */
    const feedbacks = useState<SavedFeedback[]>('feedback.data', () => [])
    /** 그리기 중 로컬에만 존재하는 미저장 피드백 목록 */
    const localFeedbacks = useState<FeedbackDraftInput[]>('feedback.localData', () => [])
    /** 피드백 추가 모드 활성 여부 (지도 클릭으로 위치 지정) */
    const isAddingFeedback = useState<boolean>('feedback.isAdding', () => false)
    /** 마커 클릭으로 선택된 피드백 (팝업 표시용) */
    const selectedMarkerFeedback = useState<(SavedFeedback | FeedbackDraftInput) | null>('feedback.selectedMarker', () => null)
    /** 피드백 데이터 로딩 중 여부 */
    const isLoading = useState<boolean>('feedback.isLoading', () => false)

    /** 피드백 추가 모드를 토글한다 */
    const toggleAddingMode = () => {
        isAddingFeedback.value = !isAddingFeedback.value
        if (!isAddingFeedback.value) {
            selectedMarkerFeedback.value = null
        }
    }

    /** 로컬 피드백을 추가한다 (미저장 상태) */
    const addLocalFeedback = (fb: FeedbackDraftInput) => {
        localFeedbacks.value = [...localFeedbacks.value, fb]
    }

    /** 로컬 피드백 목록을 초기화한다 */
    const clearLocalFeedbacks = () => {
        localFeedbacks.value = []
    }

    /** 모든 피드백 상태를 초기화한다 */
    const clearFeedbacks = () => {
        feedbacks.value = []
        localFeedbacks.value = []
        selectedMarkerFeedback.value = null
        isAddingFeedback.value = false
    }

    return {
        feedbacks,
        localFeedbacks,
        isAddingFeedback,
        selectedMarkerFeedback,
        isLoading,
        toggleAddingMode,
        addLocalFeedback,
        clearLocalFeedbacks,
        clearFeedbacks
    }
}
