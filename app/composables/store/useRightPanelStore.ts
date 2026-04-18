export type RightPanelType = 'discover' | 'feedback' | 'weather-recommend'

/**
 * 우측 패널의 활성 기능 상태를 관리하는 store composable.
 * 한 번에 하나의 패널만 표시하며, 같은 패널을 다시 누르면 닫힌다.
 */
export const useRightPanelStore = () => {
    const activePanel = useState<RightPanelType | null>('rightPanel.active', () => null)
    const isOpen = computed(() => activePanel.value !== null)

    const open = (panel: RightPanelType) => {
        activePanel.value = activePanel.value === panel ? null : panel
    }

    const close = () => {
        activePanel.value = null
    }

    return { activePanel, isOpen, open, close }
}
