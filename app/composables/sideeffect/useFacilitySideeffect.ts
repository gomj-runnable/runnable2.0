import type { ShallowRef } from 'vue'
import type { Entity } from 'cesium'
import type { CesiumViewer } from '~/composables/useWindow'
import type { Facility, FacilityType } from '#shared/types/facility'
import { FACILITY_LAYERS } from '~/composables/store/useFacilityStore'

/** 시설물 유형별 Cesium Entity 색상 (신호 횡단보도 / 무신호 횡단보도 구분) */
const CROSSWALK_SIGNAL_COLOR = '#4CAF50'
const CROSSWALK_NO_SIGNAL_COLOR = '#FF9800'

const ALL_FACILITY_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'locker', 'hospital']

const getLayerColor = (type: FacilityType) =>
    FACILITY_LAYERS.find((l) => l.type === type)?.color ?? '#FFFFFF'

interface UseFacilitySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    facilities: Ref<Facility[]>
    activeTypes: Ref<Set<FacilityType>>
    isLoading: Ref<boolean>
}

export const useFacilitySideeffect = (options: UseFacilitySideeffectOptions) => {
    const { viewer, facilities, activeTypes, isLoading } = options

    /** 유형별 추가된 Entity 참조 보관 (제거 시 사용) */
    const entityMap = new Map<FacilityType, Entity[]>()

    const fetchFacilities = async () => {
        if (facilities.value.length > 0) return

        isLoading.value = true

        try {
            const data = await $fetch<Facility[]>('/api/facilities')
            facilities.value = data
        } finally {
            isLoading.value = false
        }
    }

    const addCrosswalkEntity = (v: CesiumViewer, C: typeof import('cesium'), facility: Facility) => {
        if (facility.polyline && facility.polyline.length >= 2) {
            const flatCoords = facility.polyline.flatMap(([lng, lat]) => [lng, lat])
            const color = facility.hasSignal ? CROSSWALK_SIGNAL_COLOR : CROSSWALK_NO_SIGNAL_COLOR

            return v.entities.add({
                name: facility.name,
                polyline: {
                    positions: C.Cartesian3.fromDegreesArray(flatCoords),
                    width: 6,
                    material: C.Color.fromCssColorString(color).withAlpha(0.9) as unknown as undefined,
                    clampToGround: true
                }
            })
        }

        return null
    }

    const addPointEntity = (v: CesiumViewer, C: typeof import('cesium'), facility: Facility) => {
        const color = getLayerColor(facility.type)

        return v.entities.add({
            name: facility.name,
            position: C.Cartesian3.fromDegrees(facility.lng, facility.lat),
            point: {
                pixelSize: 10,
                color: C.Color.fromCssColorString(color),
                outlineColor: C.Color.WHITE,
                outlineWidth: 2,
                heightReference: C.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
                text: facility.name,
                font: '12px sans-serif',
                style: C.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 3,
                outlineColor: C.Color.BLACK,
                verticalOrigin: C.VerticalOrigin.BOTTOM,
                pixelOffset: new C.Cartesian2(0, -14),
                heightReference: C.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                scale: 0.9
            }
        })
    }

    const showLayer = (type: FacilityType) => {
        const v = viewer.value
        const C = window.Cesium

        if (!v || !C) return

        removeLayer(type)

        const items = facilities.value.filter((f) => f.type === type)
        const entities: Entity[] = []

        for (const facility of items) {
            const entity =
                facility.type === 'crosswalk'
                    ? addCrosswalkEntity(v, C, facility)
                    : addPointEntity(v, C, facility)

            if (entity) {
                entities.push(entity)
            }
        }

        entityMap.set(type, entities)
    }

    const removeLayer = (type: FacilityType) => {
        const v = viewer.value

        if (!v) return

        const entities = entityMap.get(type)

        if (entities) {
            for (const entity of entities) {
                v.entities.remove(entity)
            }

            entityMap.delete(type)
        }
    }

    const removeAllLayers = () => {
        for (const type of entityMap.keys()) {
            removeLayer(type)
        }
    }

    /**
     * activeTypes 변화 감지 → entityMap 상태와 비교하여 레이어 동기화.
     * Set 비교 대신 entityMap 존재 여부로 판단하여 안정성 확보.
     */
    watch(
        activeTypes,
        async (current) => {
            await fetchFacilities()

            for (const type of ALL_FACILITY_TYPES) {
                const shouldShow = current.has(type)
                const isShown = entityMap.has(type)

                if (shouldShow && !isShown) {
                    showLayer(type)
                } else if (!shouldShow && isShown) {
                    removeLayer(type)
                }
            }
        },
        { deep: true }
    )

    onBeforeUnmount(() => {
        removeAllLayers()
    })

    return {
        fetchFacilities,
        removeAllLayers
    }
}
