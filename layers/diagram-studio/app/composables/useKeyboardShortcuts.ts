import { onMounted, onUnmounted } from '#imports'
import type { TabKind } from '../../runtime/types'
import { TAB_KEYS, TABS_DEF } from './useDiagramTabs'

export interface KeyboardShortcut {
    keys: string[]
    description: string
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
    {
        keys: TABS_DEF.map((t) => t.shortcut),
        description: '탭 전환'
    },
    { keys: ['/'], description: '검색 포커스' },
    { keys: ['?'], description: '이 도움말 열기/닫기' }
]

interface ShortcutHandlers {
    onTabSelect: (tab: TabKind) => void
    onSearchFocus: () => void
    onHelpToggle?: () => void
}

export function useKeyboardShortcuts({
    onTabSelect,
    onSearchFocus,
    onHelpToggle
}: ShortcutHandlers) {
    function handle(e: KeyboardEvent) {
        const target = e.target as HTMLElement
        const isEditable =
            target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
        if (isEditable) return

        if (e.key === '/') {
            e.preventDefault()
            onSearchFocus()
            return
        }

        if (e.key === '?') {
            e.preventDefault()
            onHelpToggle?.()
            return
        }

        // 숫자 키(1~9)에 한해 탭 전환 처리. Escape/Tab 등 비숫자 키는 NaN으로 무시된다.
        if (!/^[1-9]$/.test(e.key)) return

        const idx = parseInt(e.key, 10) - 1
        const tab = TAB_KEYS[idx]
        if (tab !== undefined) {
            onTabSelect(tab)
        }
    }

    onMounted(() => window.addEventListener('keydown', handle))
    onUnmounted(() => window.removeEventListener('keydown', handle))
}
