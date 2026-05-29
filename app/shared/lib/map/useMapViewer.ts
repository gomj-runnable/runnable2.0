import { shallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'

// 전역 단일 Cesium viewer 참조. useMapInit 준비 후 set 된다. (SPA 단일 인스턴스)
const viewerRef = shallowRef<CesiumViewer | null>(null)

/** 코어·플러그인 공용 viewer 접근. 플러그인은 viewer.value 준비를 watch 한다. */
export function useMapViewer() {
    const setViewer = (v: CesiumViewer | null) => {
        viewerRef.value = v
    }
    return { viewer: viewerRef, setViewer }
}
