import { describe, it, expect, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import { createEntityGroup } from '~/shared/lib/map/useEntityCleanup'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'

const makeEntity = (id: string): CesiumEntity =>
    ({
        id,
        show: true
    }) as unknown as CesiumEntity

const makeViewer = () => {
    const entities: CesiumEntity[] = []
    const v = {
        entities: {
            add: (opts: any) => {
                const e = makeEntity(opts.id ?? `e-${entities.length}`)
                entities.push(e)
                return e
            },
            remove: (e: CesiumEntity) => {
                const i = entities.indexOf(e)
                if (i >= 0) entities.splice(i, 1)
            },
            list: entities
        }
    } as unknown as CesiumViewer
    return v
}

describe('createEntityGroup()', () => {
    let viewer: ShallowRef<CesiumViewer | null>

    beforeEach(() => {
        viewer = shallowRef<CesiumViewer | null>(makeViewer())
    })

    it('add — viewer 가 null 이면 null 반환', () => {
        viewer.value = null
        const group = createEntityGroup(viewer)
        expect(group.add({ id: 'x' })).toBeNull()
    })

    it('add — entities 배열에 누적', () => {
        const group = createEntityGroup(viewer)
        group.add({ id: 'a' })
        group.add({ id: 'b' })
        expect(group.entities.value).toHaveLength(2)
    })

    it('clear — viewer 가 null 이면 무동작', () => {
        const group = createEntityGroup(viewer)
        group.add({ id: 'a' })
        viewer.value = null
        group.clear()
        expect(group.entities.value).toHaveLength(1)
    })

    it('clear — entities 모두 viewer.entities.remove() + 내부 배열 초기화', () => {
        const group = createEntityGroup(viewer)
        group.add({ id: 'a' })
        group.add({ id: 'b' })
        group.clear()
        expect(group.entities.value).toHaveLength(0)
        expect((viewer.value!.entities as any).list).toHaveLength(0)
    })

    it('set — entities 배열 교체 (기존은 제거하지 않음)', () => {
        const group = createEntityGroup(viewer)
        group.add({ id: 'a' })

        const newEntities = [makeEntity('x'), makeEntity('y')]
        group.set(newEntities)
        expect(group.entities.value).toBe(newEntities)
        // 기존 entity 는 viewer 에서 제거되지 않음
        expect((viewer.value!.entities as any).list).toHaveLength(1)
    })

    it('hide — 모든 entity.show = false', () => {
        const group = createEntityGroup(viewer)
        group.add({ id: 'a' })
        group.add({ id: 'b' })
        group.hide()
        for (const e of group.entities.value) {
            expect(e.show).toBe(false)
        }
    })

    it('show — 모든 entity.show = true', () => {
        const group = createEntityGroup(viewer)
        group.add({ id: 'a' })
        group.hide()
        group.show()
        for (const e of group.entities.value) {
            expect(e.show).toBe(true)
        }
    })
})
