import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/composables/useWindow'

/**
 * Cesium 엔티티 배열의 생명주기를 관리하는 헬퍼를 생성한다.
 * 지도에 추가된 엔티티를 추적하고, 일괄 제거 기능을 제공한다.
 */
export const createEntityGroup = (viewer: ShallowRef<CesiumViewer | null>) => {
    const entities = shallowRef<CesiumEntity[]>([])

    /** 엔티티 배열을 지도에서 일괄 제거하고 내부 목록을 초기화한다. */
    const clear = () => {
        if (!viewer.value) return
        entities.value.forEach((entity) => viewer.value?.entities.remove(entity))
        entities.value = []
    }

    /** 엔티티 배열을 교체한다. 기존 것은 제거하지 않는다. */
    const set = (newEntities: CesiumEntity[]) => {
        entities.value = newEntities
    }

    /** 모든 엔티티를 화면에서 숨긴다. 엔티티 자체는 유지된다. */
    const hide = () => {
        entities.value.forEach((entity) => { entity.show = false })
    }

    /** 숨긴 엔티티를 다시 표시한다. */
    const show = () => {
        entities.value.forEach((entity) => { entity.show = true })
    }

    return { entities, clear, set, hide, show }
}
