import type { ShallowRef } from 'vue'
import type { Entity } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { Facility, FacilityType } from '#shared/types/facility'
import { facilityPolyline, facilityAttrBool } from '#shared/types/facility'
import { createClampedPolyline } from '~/entities/route/lib/useGroundClamping'
import { toCesiumColor } from '~/entities/route/lib/useRouteDrawUtils'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { usePoiOverlay } from '~/shared/lib/map/usePoiOverlay'
import type { PoiDto } from '~/shared/lib/map/usePoiOverlay'
import { FacilityTypeEnum } from '#shared/types/facility-type.enum'
import { toPoiDto } from './useFacilityConversion'

/** 시설물 유형별 Cesium Entity 색상 (신호 횡단보도 / 무신호 횡단보도 구분) */
const CROSSWALK_SIGNAL_COLOR = '#4CAF50'
const CROSSWALK_NO_SIGNAL_COLOR = '#FF9800'

export const ALL_FACILITY_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'locker', 'toilet']

const getLayerColor = (type: FacilityType) => FacilityTypeEnum.from(type)?.color ?? '#FFFFFF'

interface UseFacilityRendererOptions {
    viewer: ShallowRef<CesiumViewer | null>
    facilities: Ref<Facility[]>
    onPoiClick?: (facility: Facility) => void
    onFacilitySelect?: (facility: Facility | null) => void
}

/**
 * 시설물 렌더링 로직: Entity/POI 추가·제거를 관리한다.
 */
export const useFacilityRenderer = (options: UseFacilityRendererOptions) => {
    const { viewer, facilities, onPoiClick, onFacilitySelect } = options

    /** 유형별 추가된 Entity 참조 보관 (횡단보도 polyline 전용) */
    const entityMap = new Map<FacilityType, Entity[]>()
    /** Entity → Facility 역참조 맵 (횡단보도 클릭 시 POI 데이터 추출에 사용) */
    const entityToFacilityMap = new Map<Entity, Facility>()

    /** 유형별 POI ID 목록 (제거 시 사용) */
    const poiIdMap = new Map<FacilityType, string[]>()
    /** POI ID → Facility 역참조 맵 */
    const poiToFacilityMap = new Map<string, Facility>()

    /** POI(음수대/물품보관함/화장실) HTML Overlay */
    const poiOverlay = usePoiOverlay(viewer, {
        onClick: (dto) => {
            const facility = poiToFacilityMap.get(dto.id)
            if (!facility) return

            if (onPoiClick) {
                onPoiClick(facility)
                return
            }
            onFacilitySelect?.(facility)
        },
        colorResolver: (dto) => {
            const facility = poiToFacilityMap.get(dto.id)
            return facility ? getLayerColor(facility.type) : '#2196F3'
        }
    })

    const addCrosswalkEntity = (v: CesiumViewer, facility: Facility) => {
        const polyline = facilityPolyline(facility)
        if (polyline && polyline.length >= 2) {
            const color = facilityAttrBool(facility, 'hasSignal')
                ? CROSSWALK_SIGNAL_COLOR
                : CROSSWALK_NO_SIGNAL_COLOR
            const positions = polyline.map(([lng, lat]) => [lng, lat, 0] as GeoJsonPosition)

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

    /**
     * 특정 유형의 시설물을 지도에 추가한다.
     * 횡단보도는 Entity(polyline), 나머지는 HTML Overlay(POI 핀)로 렌더링한다.
     */
    const showLayer = (type: FacilityType) => {
        const v = viewer.value
        if (!v) return

        removeLayer(type)

        const items = facilities.value.filter((f) => f.type === type)

        if (type === 'crosswalk') {
            const entities: Entity[] = []
            for (const facility of items) {
                const entity = addCrosswalkEntity(v, facility)
                if (entity) {
                    entities.push(entity)
                    entityToFacilityMap.set(entity, facility)
                }
            }
            entityMap.set(type, entities)
        } else {
            const ids: string[] = []
            for (const facility of items) {
                const dto = toPoiDto(facility)
                poiToFacilityMap.set(dto.id, facility)
                poiOverlay.showPoi(dto)
                ids.push(dto.id)
            }
            poiIdMap.set(type, ids)
        }
    }

    /**
     * 특정 유형의 시설물을 지도에서 모두 제거한다.
     */
    const removeLayer = (type: FacilityType) => {
        const v = viewer.value

        // 횡단보도: Entity 제거
        const entities = entityMap.get(type)
        if (entities && v) {
            for (const entity of entities) {
                v.entities.remove(entity)
                entityToFacilityMap.delete(entity)
            }
            entityMap.delete(type)
        }

        // POI Overlay 제거
        const ids = poiIdMap.get(type)
        if (ids) {
            for (const id of ids) {
                poiOverlay.unshowPoi({ id })
                poiToFacilityMap.delete(id)
            }
            poiIdMap.delete(type)
        }
    }

    /** 모든 유형의 시설물을 지도에서 일괄 제거한다. */
    const removeAllLayers = () => {
        for (const type of ALL_FACILITY_TYPES) {
            removeLayer(type)
        }
        poiOverlay.clear()
        poiToFacilityMap.clear()
    }

    /** 레이어 표시 여부 확인 */
    const isLayerShown = (type: FacilityType) => entityMap.has(type) || poiIdMap.has(type)

    /** Entity → Facility 역참조 조회 */
    const getFacilityByEntity = (entity: Entity) => entityToFacilityMap.get(entity)

    return {
        entityMap,
        poiIdMap,
        showLayer,
        removeLayer,
        removeAllLayers,
        isLayerShown,
        getFacilityByEntity
    }
}
