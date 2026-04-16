import type { SavedFeedback } from '#shared/types/feedback'

/**
 * 경로 피드백 상태를 관리하는 store composable.
 * 피드백 목록, 추가 모드, 선택된 피드백을 관리한다.
 */
export const useFeedbackStore = () => {
    /** 현재 경로의 피드백 목록 */
    const feedbacks = useState<SavedFeedback[]>('feedback.data', () => [])
    /** 피드백 추가 모드 활성 여부 (지도 클릭으로 위치 지정) */
    const isAddingFeedback = useState<boolean>('feedback.isAdding', () => false)
    /** 현재 선택된(팝업 표시 중인) 피드백 */
    const selectedFeedback = useState<SavedFeedback | null>('feedback.selected', () => null)
    /** 피드백 데이터 로딩 중 여부 */
    const isLoading = useState<boolean>('feedback.isLoading', () => false)
    /** 피드백 패널 표시 여부 */
    const isPanelVisible = useState<boolean>('feedback.panelVisible', () => false)

    /** 피드백 추가 모드를 토글한다 */
    const toggleAddingMode = () => {
        isAddingFeedback.value = !isAddingFeedback.value
        if (!isAddingFeedback.value) {
            selectedFeedback.value = null
        }
    }

    /** 피드백 패널 표시를 토글한다 */
    const togglePanel = () => {
        isPanelVisible.value = !isPanelVisible.value
    }

    /** 피드백 목록을 초기화한다 */
    const clearFeedbacks = () => {
        feedbacks.value = []
        selectedFeedback.value = null
        isAddingFeedback.value = false
    }

    return {
        feedbacks,
        isAddingFeedback,
        selectedFeedback,
        isLoading,
        isPanelVisible,
        toggleAddingMode,
        togglePanel,
        clearFeedbacks
    }
}
