import type { DrawActionData } from '~/composables/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import { RouteDraftBuilder } from '#shared/schemas/route.schema'
import type { SectionPointRange } from '~/composables/action/useRouteDrawDraft'

export const useRouteDrawStore = () => {
    const searchQuery = ref('')
    const activeNav = ref('목록')
    const drawnPositions = ref<unknown[] | null>(null)
    const drawMetrics = ref<DrawActionData | null>(null)
    const sectionDraft = ref<CreateSectionSchema | null>(null)
    const sectionPointRanges = ref<SectionPointRange[]>([])
    const isRouteSaveModalOpen = ref(false)
    const routeForm = ref({
        title: '',
        description: ''
    })

    const routeDistance = computed(() => new RouteDraftBuilder(drawMetrics.value).getDistance())

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
