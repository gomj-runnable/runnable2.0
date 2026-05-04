import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

interface UseSidewalkSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * 동별 인도 데이터를 로드하고 Cesium GroundPolylinePrimitive로 렌더링하는 sideeffect composable.
 * `useSidewalkStore`의 selectedDistrict·selectedDong 변화를 감지해 동별로 fetch·렌더·제거를 처리한다.
 */
export const useSidewalkSideeffect = (options: UseSidewalkSideeffectOptions) => {
    const { viewer } = options
    const store = useSidewalkStore()
    const camera = useCameraStore()

    /** 현재 렌더링된 Primitive의 키 ("구/동") */
    const primitiveMap = new Map<string, unknown>()
    /** 좌표 데이터 캐시 (재로드 방지) */
    const dataCache = new Map<string, [number, number][][]>()

    /** index.json을 fetch하여 districts 상태를 초기화한다. */
    const loadDistricts = async () => {
        if (store.districts.value.length > 0) return

        try {
            const data = await $fetch<
                {
                    name: string
                    code: string
                    count: number
                    dongs: { name: string; count: number }[]
                }[]
            >('/sidewalk/index.json')
            store.districts.value = data
        } catch (e) {
            console.error('[useSidewalkSideeffect] index.json 로드 실패', e)
        }
    }

    /** 동 데이터를 fetch하고 캐시한다. */
    const fetchDong = async (district: string, dong: string): Promise<[number, number][][]> => {
        const key = `${district}/${dong}`
        if (dataCache.has(key)) return dataCache.get(key)!

        const data = await $fetch<[number, number][][]>(
            `/sidewalk/${encodeURIComponent(district)}/${encodeURIComponent(dong)}.json`
        )
        dataCache.set(key, data)
        return data
    }

    /** 동 인도 데이터를 GroundPolylinePrimitive로 지도에 추가한다. */
    const renderDong = async (district: string, dong: string) => {
        const key = `${district}/${dong}`
        if (primitiveMap.has(key)) return

        const v = viewer.value
        if (!v) return

        const C = getCesiumRuntime()

        const coords = await fetchDong(district, dong)
        const color = C.Color.fromCssColorString('#FF7043').withAlpha(0.85)

        const instances = coords
            .filter((line) => line.length >= 2)
            .map(
                (line) =>
                    new C.GeometryInstance({
                        geometry: new C.GroundPolylineGeometry({
                            positions: C.Cartesian3.fromDegreesArray(line.flat()),
                            width: 4
                        })
                    })
            )

        if (instances.length === 0) return

        const primitive = v.scene.groundPrimitives.add(
            new C.GroundPolylinePrimitive({
                geometryInstances: instances,
                appearance: new C.PolylineMaterialAppearance({
                    material: C.Material.fromType('Color', { color })
                }),
                classificationType: C.ClassificationType.BOTH
            })
        )

        primitiveMap.set(key, primitive)
    }

    /** 특정 키의 Primitive를 지도에서 제거한다. */
    const removePrimitive = (key: string) => {
        const v = viewer.value
        const primitive = primitiveMap.get(key)
        if (!v || !primitive) return

        v.scene.groundPrimitives.remove(primitive)
        primitiveMap.delete(key)
    }

    /** 모든 Primitive를 제거한다. */
    const removeAll = () => {
        for (const key of [...primitiveMap.keys()]) {
            removePrimitive(key)
        }
    }

    /** isActive 토글: ON → 현재 위치 인도 표시, OFF → 모든 Primitive 제거 */
    watch(store.isActive, (active) => {
        if (active) {
            searchByCurrentLocation()
        } else {
            removeAll()
            store.clearSelection()
        }
    })

    /** selectedDistrict + selectedDong 변화 감지 → 렌더/제거 동기화 */
    watch(
        [store.selectedDistrict, store.selectedDong],
        async ([district, dong], [prevDistrict, prevDong]) => {
            // 이전 렌더링 제거
            if (prevDistrict && (prevDistrict !== district || prevDong !== dong)) {
                if (prevDong) {
                    removePrimitive(`${prevDistrict}/${prevDong}`)
                }
            }

            // 동이 선택되면 해당 동만 렌더링
            if (district && dong) {
                store.isLoading.value = true
                try {
                    await renderDong(district, dong)
                } finally {
                    store.isLoading.value = false
                }
                return
            }

            // 구만 선택되고 동은 미선택이면 기타 포함 전체 동 렌더링
            if (district && !dong) {
                removeAll()
                const gu = store.districts.value.find((d) => d.name === district)
                if (gu) {
                    store.isLoading.value = true
                    try {
                        await Promise.all(gu.dongs.map((d) => renderDong(district, d.name)))
                    } finally {
                        store.isLoading.value = false
                    }
                }
            }
        }
    )

    /**
     * 카메라 중심 위치(locationLabel)에서 구·동 이름을 추출해 상태를 업데이트한다.
     * watch가 변경을 감지해 렌더링을 실행한다.
     */
    const searchByCurrentLocation = () => {
        store.setDistrictFromLocation(camera.locationLabel.value)
    }

    onMounted(async () => {
        await loadDistricts()
    })

    onBeforeUnmount(() => {
        removeAll()
    })

    return { searchByCurrentLocation }
}
