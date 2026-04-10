import type { Facility, FacilityType, FacilityLayerConfig } from '#shared/types/facility'

export const FACILITY_LAYERS: FacilityLayerConfig[] = [
    { type: 'crosswalk', label: '횡단보도', icon: 'i-lucide-footprints', color: '#4CAF50' },
    { type: 'fountain', label: '음수대', icon: 'i-lucide-droplets', color: '#2196F3' },
    { type: 'locker', label: '보관함', icon: 'i-lucide-package', color: '#9C27B0' },
    { type: 'hospital', label: '병원', icon: 'i-lucide-cross', color: '#F44336' }
]

export const useFacilityStore = () => {
    const facilities = useState<Facility[]>('facility.data', () => [])
    const activeTypes = useState<Set<FacilityType>>('facility.activeTypes', () => new Set())
    const isLoading = useState<boolean>('facility.isLoading', () => false)

    const isTypeActive = (type: FacilityType) => activeTypes.value.has(type)

    const toggleType = (type: FacilityType) => {
        const next = new Set(activeTypes.value)

        if (next.has(type)) {
            next.delete(type)
        } else {
            next.add(type)
        }

        activeTypes.value = next
    }

    const facilitiesByType = (type: FacilityType) =>
        facilities.value.filter((f) => f.type === type)

    return {
        facilities,
        activeTypes,
        isLoading,
        isTypeActive,
        toggleType,
        facilitiesByType
    }
}
