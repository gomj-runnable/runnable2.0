import { ref, computed } from '#imports'
import type { DiagramNode, DiagramEdge } from '../../runtime/types'

export function useDiagramFilters(nodes: () => DiagramNode[], edges: () => DiagramEdge[]) {
    const searchQuery = ref('')
    const selectedGroups = ref<string[]>([])

    const allGroups = computed(() => {
        const groups = new Set(
            nodes()
                .map((n) => n.group)
                .filter(Boolean) as string[]
        )
        return [...groups].sort()
    })

    const filteredNodes = computed(() => {
        let result = nodes()
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase()
            result = result.filter(
                (n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
            )
        }
        if (selectedGroups.value.length > 0) {
            result = result.filter((n) => n.group && selectedGroups.value.includes(n.group))
        }
        return result
    })

    const filteredNodeIds = computed(() => new Set(filteredNodes.value.map((n) => n.id)))

    const filteredEdges = computed(() =>
        edges().filter(
            (e) => filteredNodeIds.value.has(e.source) && filteredNodeIds.value.has(e.target)
        )
    )

    function toggleGroup(group: string) {
        const idx = selectedGroups.value.indexOf(group)
        if (idx >= 0) {
            selectedGroups.value.splice(idx, 1)
        } else {
            selectedGroups.value.push(group)
        }
    }

    function resetFilters() {
        searchQuery.value = ''
        selectedGroups.value = []
    }

    return {
        searchQuery,
        selectedGroups,
        allGroups,
        filteredNodes,
        filteredEdges,
        toggleGroup,
        resetFilters
    }
}
