import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEntityGroup } from '~/shared/lib/cesium/operation/useEntityCleanup'
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'

// viewer 소유권은 CesiumController(useMapViewer)에 있다. 테스트는 공유 ref 를 직접 제어한다.
vi.mock('~/shared/lib/cesium/getters/useMapViewer', async () => {
    const { shallowRef } = await import('vue')
    const viewer = shallowRef<unknown>(null)
    return {
        useMapViewer: () => ({
            viewer,
            setViewer: (v: unknown) => {
                viewer.value = v
            }
        })
    }
})

const { setViewer: setMockViewer } = useMapViewer() as unknown as {
    setViewer: (v: unknown) => void
}

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
    let viewer: CesiumViewer

    beforeEach(() => {
        setMockViewer(null)
        viewer = makeViewer()
        setMockViewer(viewer)
    })

    it('add — viewer 가 null 이면 null 반환', () => {
        setMockViewer(null)
        const group = createEntityGroup()
        expect(group.add({ id: 'x' })).toBeNull()
    })

    it('add — entities 배열에 누적', () => {
        const group = createEntityGroup()
        group.add({ id: 'a' })
        group.add({ id: 'b' })
        expect(group.entities.value).toHaveLength(2)
    })

    it('clear — viewer 가 null 이면 무동작', () => {
        const group = createEntityGroup()
        group.add({ id: 'a' })
        setMockViewer(null)
        group.clear()
        expect(group.entities.value).toHaveLength(1)
    })

    it('clear — entities 모두 viewer.entities.remove() + 내부 배열 초기화', () => {
        const group = createEntityGroup()
        group.add({ id: 'a' })
        group.add({ id: 'b' })
        group.clear()
        expect(group.entities.value).toHaveLength(0)
        expect((viewer.entities as any).list).toHaveLength(0)
    })

    it('set — entities 배열 교체 (기존은 제거하지 않음)', () => {
        const group = createEntityGroup()
        group.add({ id: 'a' })

        const newEntities = [makeEntity('x'), makeEntity('y')]
        group.set(newEntities)
        expect(group.entities.value).toBe(newEntities)
        // 기존 entity 는 viewer 에서 제거되지 않음
        expect((viewer.entities as any).list).toHaveLength(1)
    })

    it('hide — 모든 entity.show = false', () => {
        const group = createEntityGroup()
        group.add({ id: 'a' })
        group.add({ id: 'b' })
        group.hide()
        for (const e of group.entities.value) {
            expect(e.show).toBe(false)
        }
    })

    it('show — 모든 entity.show = true', () => {
        const group = createEntityGroup()
        group.add({ id: 'a' })
        group.hide()
        group.show()
        for (const e of group.entities.value) {
            expect(e.show).toBe(true)
        }
    })
})
