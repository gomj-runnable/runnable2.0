/**
 * 고도 시각화 레이어의 표시 여부를 관리하는 store composable.
 */
export const useElevationLayerStore = () => {
    const isElevationVisible = useState<boolean>('elevation.isVisible', () => false)

    const toggleElevation = () => {
        isElevationVisible.value = !isElevationVisible.value
    }

    const showElevation = () => {
        isElevationVisible.value = true
    }

    const hideElevation = () => {
        isElevationVisible.value = false
    }

    return { isElevationVisible, toggleElevation, showElevation, hideElevation }
}
