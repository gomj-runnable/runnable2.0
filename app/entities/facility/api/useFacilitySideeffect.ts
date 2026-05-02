import type { ShallowRef } from 'vue'
import type { Entity, LabelGraphics, PointGraphics } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { CesiumDrawHandler, CesiumRuntime } from '#shared/types/cesium'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { Facility, FacilityType, PoiDraftInput } from '#shared/types/facility'
import { FacilityTypeEnum } from '#shared/types/facility-type.enum'
import { FACILITY_LAYERS, useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import {
    createClampedPoint,
    createClampedLabel,
    createClampedPolyline
} from '~/entities/route/lib/useGroundClamping'
import { toCesiumColor } from '~/entities/route/lib/useRouteDrawUtils'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

/** 시설물 유형별 Cesium Entity 색상 (신호 횡단보도 / 무신호 횡단보도 구분) */
const CROSSWALK_SIGNAL_COLOR = '#4CAF50'
const CROSSWALK_NO_SIGNAL_COLOR = '#FF9800'

const ALL_FACILITY_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'locker', 'hospital', 'toilet']

const getLayerColor = (type: FacilityType) => FacilityTypeEnum.from(type)?.color ?? '#FFFFFF'

/** POI 현재 위치 검색 대상 유형 */
const SEARCHABLE_FACILITY_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'hospital', 'toilet', 'locker']

interface UseFacilitySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    facilities: Ref<Facility[]>
    activeTypes: Ref<Set<FacilityType>>
    isLoading: Ref<boolean>
    isSearching: Ref<boolean>
    /** POI 엔티티 클릭 시 호출되는 콜백. 활성 구간 연결에 사용한다. */
    onPoiClick?: (poi: PoiDraftInput) => void
}

/**
 * 시설물 데이터를 서버에서 불러오고 활성 유형에 따라 Cesium 지도에 렌더링하는 sideeffect composable.
 * `activeTypes` 변화를 감지해 표시/숨김 상태를 자동으로 동기화하며,
 * 컴포넌트 언마운트 시 모든 엔티티를 정리한다.
 *
 * @param options - 뷰어·시설물 데이터·활성 유형 상태 ref를 포함한 의존성 옵션
 */
export const useFacilitySideeffect = (options: UseFacilitySideeffectOptions) => {
    const { viewer, facilities, activeTypes, isLoading, isSearching, onPoiClick } = options
    const camera = useCameraStore()

    /** 유형별 추가된 Entity 참조 보관 (제거 시 사용) */
    const entityMap = new Map<FacilityType, Entity[]>()
    /** Entity → Facility 역참조 맵 (클릭 시 POI 데이터 추출에 사용) */
    const entityToFacilityMap = new Map<Entity, Facility>()

    /** 중복 요청 방지 플래그 */
    let fetchInFlight = false

    /**
     * 현재 카메라 위치 기반으로 시설물을 검색한다.
     * 활성 유형 중 검색 가능한 유형만 서버에 요청한다.
     */
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

    const addCrosswalkEntity = (v: CesiumViewer, _C: CesiumRuntime, facility: Facility) => {
        if (facility.polyline && facility.polyline.length >= 2) {
            const color = facility.hasSignal ? CROSSWALK_SIGNAL_COLOR : CROSSWALK_NO_SIGNAL_COLOR
            const positions = facility.polyline.map(
                ([lng, lat]) => [lng, lat, 0] as GeoJsonPosition
            )

            const C = getCesiumRuntime()
            return v.entities.add({
                name: facility.name,
                polyline: createClampedPolyline(C, {
                    positions,
                    width: 6,
                    material: toCesiumColor(C, color, 0.9)
                })
            })
        }

        return null
    }

    const addPointEntity = (v: CesiumViewer, C: CesiumRuntime, facility: Facility) => {
        const color = getLayerColor(facility.type)
        const point = createClampedPoint(C, {
            color: toCesiumColor(C, color)
        }) as ConstructorParameters<typeof PointGraphics>[0]
        const label = createClampedLabel(C, {
            text: facility.name
        }) as ConstructorParameters<typeof LabelGraphics>[0]

        return v.entities.add({
            name: facility.name,
            position: C.Cartesian3.fromDegrees(facility.lng, facility.lat),
            point,
            label
        })
    }

    /**
     * 특정 유형의 시설물 엔티티를 지도에 추가한다.
     * 기존에 표시 중인 같은 유형의 엔티티는 먼저 제거한다.
     *
     * @param type - 표시할 시설물 유형
     */
    const showLayer = (type: FacilityType) => {
        const v = viewer.value
        if (!v) return

        const C = getCesiumRuntime()
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
                entityToFacilityMap.set(entity, facility)
            }
        }

        entityMap.set(type, entities)
    }

    /**
     * 특정 유형의 시설물 엔티티를 지도에서 모두 제거한다.
     *
     * @param type - 제거할 시설물 유형
     */
    const removeLayer = (type: FacilityType) => {
        const v = viewer.value

        if (!v) return

        const entities = entityMap.get(type)

        if (entities) {
            for (const entity of entities) {
                v.entities.remove(entity)
                entityToFacilityMap.delete(entity)
            }

            entityMap.delete(type)
        }
    }

    /** 모든 유형의 시설물 엔티티를 지도에서 일괄 제거한다. */
    const removeAllLayers = () => {
        for (const type of entityMap.keys()) {
            removeLayer(type)
        }
    }

    /**
     * Facility 엔티티 → PoiDraftInput 변환 헬퍼.
     * FacilityType → PoiType 매핑 및 geom 생성을 담당한다.
     */
    const facilityToPoiDraft = (facility: Facility): PoiDraftInput | null => {
        const enumInstance = FacilityTypeEnum.from(facility.type)
        const poiType = enumInstance?.poiType

        if (!poiType) return null

        return {
            name: facility.name,
            type: poiType,
            geom: {
                type: 'Point',
                coordinates: [facility.lng, facility.lat]
            }
        }
    }

    /** Cesium 화면 클릭 → 시설물 엔티티 감지 → 팝업 표시 또는 POI 연결 */
    let clickHandler: CesiumDrawHandler | null = null
    const facilityStore = useFacilityStore()

    watch(
        viewer,
        (v) => {
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
                const facility = entityToFacilityMap.get(entity)

                if (!facility) return

                // POI 콜백이 있으면 경로 연결, 없으면 팝업 표시
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
        },
        { immediate: true }
    )

    /**
     * activeTypes 변화 감지 → entityMap 상태와 비교하여 레이어 동기화.
     * Set 비교 대신 entityMap 존재 여부로 판단하여 안정성 확보.
     */
    const activeTypesKey = computed(() => [...activeTypes.value].sort().join(','))
    watch(activeTypesKey, async () => {
        const current = activeTypes.value
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
    })

    /**
     * 현재 뷰어 중심 좌표 기반으로 인근 POI를 검색하고 시설물 데이터를 교체한다.
     * crosswalk / fountain / hospital 유형만 검색 대상으로 포함한다.
     */
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

            // 검색 결과로 교체: 검색 대상 유형만 교체하고 나머지(locker 등)는 유지
            const unchanged = facilities.value.filter(
                (f) => !SEARCHABLE_FACILITY_TYPES.includes(f.type)
            )
            facilities.value = [...unchanged, ...data]

            // 활성 레이어 재렌더링: 기존 엔티티를 먼저 제거 후 추가
            for (const type of activeSearchTypes) {
                if (activeTypes.value.has(type)) {
                    showLayer(type)
                }
            }

            // sidewalk 칩이 활성화된 경우 카메라 위치 기반 구 선택 트리거
            const sidewalk = useSidewalkStore()
            if (sidewalk.isActive.value) {
                sidewalk.setDistrictFromLocation(camera.locationLabel.value)
            }
        } finally {
            isSearching.value = false
        }
    }

    onBeforeUnmount(() => {
        removeAllLayers()
        clickHandler?.destroy()
        clickHandler = null
    })

    return {
        fetchFacilities,
        searchNearby,
        removeAllLayers
    }
}
