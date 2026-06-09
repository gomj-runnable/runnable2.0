import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

import { usePluginSurfaces } from '../usePluginSurfaces'

// registry 가 .vue 파일을 import 하는 plugin.manifest 들을 연쇄 import 하므로,
// @vitejs/plugin-vue 없는 node 환경에서는 파싱 실패한다.
// 테스트에 필요한 최소 manifest 만 주입해 .vue 의존성 체인을 차단한다.
vi.mock('../registry', () => ({
    pluginRegistry: [
        {
            id: 'explore',
            label: 'explore',
            description: '',
            slot: 'chip',
            component: {},
            defaultEnabled: true
        },
        {
            id: 'sidewalk',
            label: 'sidewalk',
            description: '',
            slot: 'chip',
            component: {},
            defaultEnabled: true
        },
        {
            id: 'demo-sidepanel',
            label: 'demo-sidepanel',
            description: '',
            slot: 'sidepanel',
            component: {},
            defaultEnabled: false
        },
        {
            id: 'demo-dashboard',
            label: 'demo-dashboard',
            description: '',
            slot: 'dashboard',
            component: {},
            defaultEnabled: false
        },
        {
            id: 'demo-popup',
            label: 'demo-popup',
            description: '',
            slot: 'popup',
            component: {},
            defaultEnabled: false
        }
    ]
}))

describe('usePluginSurfaces', () => {
    it('초기값: active=null, activeId=null', () => {
        // Arrange & Act
        const { activeId, active } = usePluginSurfaces()

        // Assert
        expect(activeId.value).toBeNull()
        expect(active.value).toBeNull()
    })

    it('open(id): activeId 갱신, active 가 해당 manifest 반환', async () => {
        // Arrange
        const { activeId, active, open } = usePluginSurfaces()

        // Act
        open('explore')
        await nextTick()

        // Assert
        expect(activeId.value).toBe('explore')
        expect(active.value?.id).toBe('explore')
    })

    it('한 번에 한 표면만: open(A) 후 open(B) 하면 active 가 B 로 대체됨', async () => {
        // Arrange
        const { activeId, active, open } = usePluginSurfaces()

        // Act
        open('sidewalk')
        await nextTick()
        open('demo-sidepanel')
        await nextTick()

        // Assert
        expect(activeId.value).toBe('demo-sidepanel')
        expect(active.value?.id).toBe('demo-sidepanel')
    })

    it('close(): active=null, activeId=null 으로 복귀', async () => {
        // Arrange
        const { activeId, active, open, close } = usePluginSurfaces()
        open('demo-dashboard')
        await nextTick()

        // Act
        close()
        await nextTick()

        // Assert
        expect(activeId.value).toBeNull()
        expect(active.value).toBeNull()
    })

    it('미등록 id 로 open: active=null (registry.find 미스)', async () => {
        // Arrange
        const { active, open } = usePluginSurfaces()

        // Act
        open('존재하지-않는-플러그인')
        await nextTick()

        // Assert
        expect(active.value).toBeNull()
    })
})
