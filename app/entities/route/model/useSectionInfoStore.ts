import type { SavedSection } from '#shared/types/route'
import type { UserPace } from '#shared/types/user-route'

export const useSectionInfoStore = () => {
    const isOpen = useState<boolean>('sectionInfo.isOpen', () => false)
    const panelTitle = useState<string>('sectionInfo.panelTitle', () => '구간 정보')
    const selectedRouteId = useState<string | null>('sectionInfo.selectedRouteId', () => null)
    const sections = useState<SavedSection[]>('sectionInfo.sections', () => [])
    const userPaces = useState<Record<string, UserPace>>('sectionInfo.userPaces', () => ({}))
    const isEditMode = useState<boolean>('sectionInfo.isEditMode', () => false)

    const open = (routeId: string, routeSections: SavedSection[]) => {
        selectedRouteId.value = routeId
        sections.value = routeSections
        isOpen.value = true
        isEditMode.value = false
        // Initialize userPaces for each section if not exists
        const paces: Record<string, UserPace> = {}
        for (const section of routeSections) {
            paces[section.sectionId] = userPaces.value[section.sectionId] ?? {
                userPaceId: '',
                userRouteId: '',
                sectionId: section.sectionId,
                pace: 330, // default 5'30"/km
                weight: 0,
                strategy: ''
            }
        }
        userPaces.value = paces
    }

    const close = () => {
        isOpen.value = false
        selectedRouteId.value = null
        sections.value = []
        isEditMode.value = false
    }

    const updatePace = (sectionId: string, pace: number) => {
        const current = userPaces.value[sectionId]
        if (current) {
            userPaces.value = { ...userPaces.value, [sectionId]: { ...current, pace } }
        }
    }

    const updateWeight = (sectionId: string, weight: number) => {
        const current = userPaces.value[sectionId]
        if (current) {
            userPaces.value = { ...userPaces.value, [sectionId]: { ...current, weight } }
        }
    }

    const updateStrategy = (sectionId: string, strategy: string) => {
        const current = userPaces.value[sectionId]
        if (current) {
            userPaces.value = { ...userPaces.value, [sectionId]: { ...current, strategy } }
        }
    }

    return {
        isOpen,
        panelTitle,
        selectedRouteId,
        sections,
        userPaces,
        isEditMode,
        open,
        close,
        updatePace,
        updateWeight,
        updateStrategy
    }
}
