import { useRoute, useRouter } from '#imports'
import type { TabKind } from '../../runtime/types'

export interface TabDef {
    key: TabKind
    label: string
    shortcut: string
}

export const TAB_KEYS: TabKind[] = ['user-journey', 'fsd', 'composables', 'classes']

export const TABS_DEF: TabDef[] = [
    { key: 'user-journey', label: 'User Journey', shortcut: '1' },
    { key: 'fsd', label: 'FSD Layers', shortcut: '2' },
    { key: 'composables', label: 'Composable Graph', shortcut: '3' },
    { key: 'classes', label: 'Class Diagrams', shortcut: '4' }
]

export function useDiagramTabs() {
    const route = useRoute()
    const router = useRouter()

    function activeTab(): TabKind {
        const k = route.params.kind
        const v = Array.isArray(k) ? k[0] : k
        return (TABS_DEF.find((t) => t.key === v)?.key ?? 'fsd') as TabKind
    }

    function goToTab(kind: TabKind) {
        router.push(`/admin/diagrams/${kind}`)
    }

    return { tabs: TABS_DEF, TAB_KEYS, activeTab, goToTab }
}
