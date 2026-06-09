import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import type { PluginManifest } from '../types'
import { usePluginPrefs } from '../usePluginPrefs'

// 테스트용 가짜 manifest 팩토리
// 렌더하지 않으므로 component 는 빈 객체로, 필요한 필드만 채운다
function makeManifest(partial: { id: string; defaultEnabled: boolean }): PluginManifest {
    return {
        id: partial.id,
        label: '',
        description: '',
        slot: 'chip',
        component: {} as PluginManifest['component'],
        defaultEnabled: partial.defaultEnabled
    }
}

describe('usePluginPrefs', () => {
    // afterEach 에서 $fetch stub 을 해제하면 setup.ts 의 useState stub 도 함께 지워진다.
    // beforeEach 에서 useState 를 복원해 다음 테스트가 컴포저블을 정상 호출할 수 있게 한다.
    beforeEach(() => {
        vi.stubGlobal('useState', <T>(_key: string, init?: () => T) =>
            ref(init ? (init() as T) : (undefined as unknown as T))
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe('load() — API 호출 성공', () => {
        it('$fetch 가 prefs 배열을 반환하면 prefs.value 가 pluginId 키 맵으로 변환된다', async () => {
            // Arrange
            vi.stubGlobal(
                '$fetch',
                vi.fn().mockResolvedValue([
                    { pluginId: 'a', enabled: true },
                    { pluginId: 'b', enabled: false }
                ])
            )
            const { prefs, load } = usePluginPrefs()

            // Act
            await load()

            // Assert
            expect(prefs.value).toEqual({ a: true, b: false })
        })
    })

    describe('load() — API 호출 실패', () => {
        it('$fetch 가 reject 되면 catch 폴백으로 prefs.value 가 빈 맵이 된다', async () => {
            // Arrange: 사전에 prefs 를 더럽혀 둔다
            vi.stubGlobal(
                '$fetch',
                vi.fn().mockResolvedValue([{ pluginId: 'dirty', enabled: true }])
            )
            const { prefs, load } = usePluginPrefs()
            await load()
            expect(prefs.value).toEqual({ dirty: true }) // 더럽혀진 상태 확인

            // Act: 이번엔 reject
            vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('네트워크 오류')))
            await load()

            // Assert: 빈 맵으로 초기화
            expect(prefs.value).toEqual({})
        })
    })

    describe('load() — API 가 빈 배열 반환', () => {
        it('$fetch 가 빈 배열을 반환하면 prefs.value 가 빈 맵이 된다', async () => {
            // Arrange
            vi.stubGlobal('$fetch', vi.fn().mockResolvedValue([]))
            const { prefs, load } = usePluginPrefs()

            // Act
            await load()

            // Assert
            expect(prefs.value).toEqual({})
        })
    })

    describe('isEnabled() — prefs 에 값이 있을 때', () => {
        it('prefs 에 해당 pluginId 가 있으면 defaultEnabled 와 무관하게 prefs 값을 우선한다', async () => {
            // Arrange: prefs={x:false}, manifest defaultEnabled=true → isEnabled=false
            vi.stubGlobal('$fetch', vi.fn().mockResolvedValue([{ pluginId: 'x', enabled: false }]))
            const { load, isEnabled } = usePluginPrefs()
            await load()
            const manifest = makeManifest({ id: 'x', defaultEnabled: true })

            // Act & Assert
            expect(isEnabled(manifest)).toBe(false)
        })
    })

    describe('isEnabled() — prefs 에 값이 없을 때', () => {
        it('prefs 에 없는 pluginId 는 manifest.defaultEnabled=true 를 폴백으로 반환한다', async () => {
            // Arrange: load 안 했거나 해당 id 가 목록에 없는 상황
            vi.stubGlobal('$fetch', vi.fn().mockResolvedValue([]))
            const { load, isEnabled } = usePluginPrefs()
            await load()
            const manifest = makeManifest({ id: 'y', defaultEnabled: true })

            // Act & Assert
            expect(isEnabled(manifest)).toBe(true)
        })

        it('prefs 에 없는 pluginId 는 manifest.defaultEnabled=false 를 폴백으로 반환한다', async () => {
            // Arrange
            vi.stubGlobal('$fetch', vi.fn().mockResolvedValue([]))
            const { load, isEnabled } = usePluginPrefs()
            await load()
            const manifest = makeManifest({ id: 'z', defaultEnabled: false })

            // Act & Assert
            expect(isEnabled(manifest)).toBe(false)
        })
    })
})
