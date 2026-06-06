import type { ShallowRef } from 'vue'
import type { Entity } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { CesiumDrawHandler } from '#shared/types/cesium'
import type { Facility, FacilityType, PoiDraftInput } from '#shared/types/facility'
import { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import {
    useFacilityRenderer,
    ALL_FACILITY_TYPES
} from '~/entities/facility/lib/useFacilityRenderer'
import {
    SEARCHABLE_FACILITY_TYPES,
    facilityToPoiDraft
} from '~/entities/facility/lib/useFacilityConversion'

interface UseFacilitySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    facilities: Ref<Facility[]>
    activeTypes: Ref<Set<FacilityType>>
    isLoading: Ref<boolean>
    isSearching: Ref<boolean>
    onPoiClick?: (poi: PoiDraftInput) => void
}

/** 시설물 데이터를 서버에서 불러오고 활성 유형에 따라 Cesium 지도에 렌더링하는 sideeffect composable. */
export const useFacilitySideeffect = (options: UseFacilitySideeffectOptions) => {
    const { viewer, facilities, activeTypes, isLoading, isSearching, onPoiClick } = options
    const camera = useCameraStore()
    const facilityStore = useFacilityStore()

    const renderer = useFacilityRenderer({
        viewer,
        facilities,
        onPoiClick: onPoiClick
            ? (facility) => {
                  const poi = facilityToPoiDraft(facility)
                  if (poi) onPoiClick(poi)
              }
            : undefined,
        onFacilitySelect: (facility) => {
            facilityStore.selectedFacility.value = facility
        }
    })

    let fetchInFlight = false

    /** 현재 카메라 위치 기반으로 시설물을 검색한다. */
    const fetchFacilities = async () => {
        const lat = camera.centerLat.value
        const lng = camera.centerLng.value
        if (lat === null || lng === null) return
        if (fetchInFlight) return

        const types = ALL_FACILITY_TYPES.filter((t) => activeTypes.value.has(t))
        if (types.length === 0) return

        fetchInFlight = true
        isLoading.value = true

        try {
            const data = await $fetch<Facility[]>('/api/facilities/nearby', {
                query: { lat, lng, types: types.join(',') }
            })
            facilities.value = data
        } finally {
            isLoading.value = false
            fetchInFlight = false
        }
    }

    let clickHandler: CesiumDrawHandler | null = null

    watch(
        viewer,
        async (v) => {
            clickHandler?.destroy()
            clickHandler = null

            if (!v) return

            const C = getCesiumRuntime()
            const handler = new C.ScreenSpaceEventHandler(v.scene.canvas)

            handler.setInputAction((movement) => {
                if (!movement.position) return
                const picked = v.scene.pick(movement.position as import('cesium').Cartesian2)
                if (!picked?.id) {
                    facilityStore.selectedFacility.value = null
                    return
                }
                const entity = picked.id as Entity
                const facility = renderer.getFacilityByEntity(entity)
                if (!facility) return
                if (onPoiClick) {
                    const poi = facilityToPoiDraft(facility)
                    if (poi) {
                        onPoiClick(poi)
                        return
                    }
                }
                facilityStore.selectedFacility.value = facility
            }, C.ScreenSpaceEventType.LEFT_CLICK)

            clickHandler = handler

            if (activeTypes.value.size > 0) {
                // immediate watch 는 등록과 동시에 콜백을 동기 실행하므로, watch() 반환 전에
                // 핸들을 참조하면 TDZ 가 발생한다. 객체에 담아 안전하게 자기 자신을 해제한다.
                const cameraWatch: { stop?: () => void } = {}
                cameraWatch.stop = watch(
                    [camera.centerLat, camera.centerLng],
                    async ([lat, lng]) => {
                        if (lat === null || lng === null) return
                        cameraWatch.stop?.()
                        await fetchFacilities()
                        for (const type of activeTypes.value) {
                            renderer.showLayer(type)
                        }
                    },
                    { immediate: true }
                )
            }
        },
        { immediate: true }
    )

    const activeTypesKey = computed(() => [...activeTypes.value].sort().join(','))

    const syncLayers = async () => {
        await fetchFacilities()
        for (const type of ALL_FACILITY_TYPES) {
            const shouldShow = activeTypes.value.has(type)
            const isShown = renderer.isLayerShown(type)
            if (shouldShow && !isShown) renderer.showLayer(type)
            else if (!shouldShow && isShown) renderer.removeLayer(type)
        }
    }

    watch(activeTypesKey, async () => {
        if (camera.centerLat.value === null || camera.centerLng.value === null) {
            // immediate watch 의 동기 첫 실행에서 핸들을 참조하면 TDZ 가 발생하므로
            // 객체에 담아 안전하게 자기 자신을 해제한다.
            const cameraWatch: { stop?: () => void } = {}
            cameraWatch.stop = watch(
                [camera.centerLat, camera.centerLng],
                async ([lat, lng]) => {
                    if (lat === null || lng === null) return
                    cameraWatch.stop?.()
                    await syncLayers()
                },
                { immediate: true }
            )
            return
        }
        await syncLayers()
    })

    /** 현재 뷰어 중심 좌표 기반으로 인근 POI를 검색하고 시설물 데이터를 교체한다. */
    const searchNearby = async () => {
        const lat = camera.centerLat.value
        const lng = camera.centerLng.value

        if (lat === null || lng === null) return
        if (isSearching.value) return

        isSearching.value = true

        try {
            const activeSearchTypes = SEARCHABLE_FACILITY_TYPES.filter((t) =>
                activeTypes.value.has(t)
            )

            const data = await $fetch<Facility[]>('/api/facilities/nearby', {
                query: { lat, lng, types: activeSearchTypes.join(',') }
            })

            const unchanged = facilities.value.filter(
                (f) => !SEARCHABLE_FACILITY_TYPES.includes(f.type)
            )
            facilities.value = [...unchanged, ...data]

            for (const type of activeSearchTypes) {
                if (activeTypes.value.has(type)) {
                    renderer.showLayer(type)
                }
            }
        } finally {
            isSearching.value = false
        }
    }

    onBeforeUnmount(() => {
        renderer.removeAllLayers()
        clickHandler?.destroy()
        clickHandler = null
    })

    return {
        fetchFacilities,
        searchNearby,
        removeAllLayers: renderer.removeAllLayers
    }
}
