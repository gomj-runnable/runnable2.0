import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { useSidewalkStore } from '~/composables/store/useSidewalkStore'

interface UseSidewalkSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * 구별 인도 데이터를 로드하고 Cesium GroundPolylinePrimitive로 렌더링하는 sideeffect composable.
 * `useSidewalkStore`의 selectedDistricts 변화를 감지해 구별로 fetch·렌더·제거를 처리한다.
 */
export const useSidewalkSideeffect = (options: UseSidewalkSideeffectOptions) => {
    const { viewer } = options
    const store = useSidewalkStore()

    /** 구별 Primitive 참조 */
    const primitiveMap = new Map<string, unknown>()
    /** 구별 좌표 데이터 캐시 (재로드 방지) */
    const dataCache = new Map<string, [number, number][][]>()

    /** index.json을 fetch하여 districts 상태를 초기화한다. */
    const loadDistricts = async () => {
        if (store.districts.value.length > 0) return

        try {
            const data =
                await $fetch<{ name: string; code: string; count: number }[]>(
                    '/sidewalk/index.json'
                )
            store.districts.value = data
        } catch (e) {
            console.error('[useSidewalkSideeffect] index.json 로드 실패', e)
        }
    }

    /** 구 이름으로 좌표 데이터를 fetch하고 캐시한다. */
    const fetchDistrict = async (name: string): Promise<[number, number][][]> => {
        if (dataCache.has(name)) return dataCache.get(name)!

        const data = await $fetch<[number, number][][]>(`/sidewalk/${name}.json`)
        dataCache.set(name, data)
        return data
    }

    /** 구 인도 데이터를 GroundPolylinePrimitive로 지도에 추가한다. */
    const renderDistrict = async (name: string) => {
        const v = viewer.value
        const C = window.Cesium

        if (!v || !C) return

        const coords = await fetchDistrict(name)
        const color = C.Color.fromCssColorString('#78909C').withAlpha(0.6)

        const instances = coords
            .filter((line) => line.length >= 2)
            .map(
                (line) =>
                    new C.GeometryInstance({
                        geometry: new C.GroundPolylineGeometry({
                            positions: C.Cartesian3.fromDegreesArray(line.flat()),
                            width: 3
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

        primitiveMap.set(name, primitive)
    }

    /** 구 인도 Primitive를 지도에서 제거한다. */
    const removeDistrict = (name: string) => {
        const v = viewer.value
        const primitive = primitiveMap.get(name)

        if (!v || !primitive) return

        v.scene.groundPrimitives.remove(primitive)
        primitiveMap.delete(name)
    }

    /** 모든 구 Primitive를 제거한다. */
    const removeAllDistricts = () => {
        for (const name of [...primitiveMap.keys()]) {
            removeDistrict(name)
        }
    }

    /** selectedDistricts 변화 감지 → 추가/제거 동기화 */
    watch(
        store.selectedDistricts,
        async (current) => {
            const rendered = new Set(primitiveMap.keys())

            for (const name of current) {
                if (!rendered.has(name)) {
                    await renderDistrict(name)
                }
            }

            for (const name of rendered) {
                if (!current.has(name)) {
                    removeDistrict(name)
                }
            }
        },
        { deep: true }
    )

    onMounted(async () => {
        await loadDistricts()
    })

    onBeforeUnmount(() => {
        removeAllDistricts()
    })
}
