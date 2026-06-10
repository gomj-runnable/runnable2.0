import { watch } from 'vue'
import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { CesiumViewerRuntime } from '#shared/types/cesium'
import type { BaseMapEnum } from '#shared/types/base-map.enum'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { useBaseMapStore } from '~/features/base-map/model/useBaseMapStore'
import { buildVworldUrl, VWORLD_MIN_LEVEL, VWORLD_MAX_LEVEL } from '~/features/base-map/lib/vworld'

interface UseBaseMapSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    /** V-World WMTS 키 (runtimeConfig.public.vworldKey) */
    vworldKey: string
}

/**
 * V-World 베이스맵(위성영상/기본지도)을 Cesium imageryLayers에 적용하는 sideeffect composable.
 * 베이스맵 종류 상태는 useBaseMapStore가 보유하며, 이 composable이 store를 watch해 교체한다.
 */
export const useBaseMapSideeffect = (options: UseBaseMapSideeffectOptions) => {
    const { viewer, vworldKey } = options
    const store = useBaseMapStore()

    /** 선택된 베이스맵 imagery로 단일 레이어를 교체한다. */
    const applyBaseMap = (kind: BaseMapEnum) => {
        const v = viewer.value
        if (!v) return

        if (!vworldKey) {
            console.warn(
                '[useBaseMapSideeffect] V-World 키가 비어 있어 베이스맵을 적용할 수 없습니다.'
            )
            return
        }

        const CesiumLib = getCesiumRuntime()
        const rawViewer = v as unknown as CesiumViewerRuntime
        const layers = rawViewer.imageryLayers
        if (!layers) return

        layers.removeAll()
        layers.addImageryProvider(
            new CesiumLib.UrlTemplateImageryProvider({
                url: buildVworldUrl(kind.key, vworldKey),
                minimumLevel: VWORLD_MIN_LEVEL,
                maximumLevel: VWORLD_MAX_LEVEL
            })
        )
    }

    // 공통 컨텍스트(store) 기반 적용 — viewer 준비·종류 변경 시 자동 반영
    watch(
        [viewer, () => store.kind.value] as const,
        ([v, kind]) => {
            if (!v) return
            applyBaseMap(kind)
        },
        { immediate: true }
    )

    return { applyBaseMap }
}
