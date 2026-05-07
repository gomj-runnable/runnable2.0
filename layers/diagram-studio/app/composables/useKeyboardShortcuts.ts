import { onMounted, onUnmounted } from '#imports'
import type { TabKind } from '../components/DiagramTabs.vue'

interface ShortcutHandlers {
    onTabSelect: (tab: TabKind) => void
    onSearchFocus: () => void
}

const TAB_KEYS: TabKind[] = ['user-journey', 'fsd', 'composables', 'classes']

export function useKeyboardShortcuts({ onTabSelect, onSearchFocus }: ShortcutHandlers) {
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

        const idx = parseInt(e.key) - 1
        const tab = TAB_KEYS[idx]
        if (tab !== undefined) {
            onTabSelect(tab)
        }
    }

    onMounted(() => window.addEventListener('keydown', handle))
    onUnmounted(() => window.removeEventListener('keydown', handle))
}
