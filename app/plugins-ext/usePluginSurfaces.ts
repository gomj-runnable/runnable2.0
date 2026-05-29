import type { PluginManifest } from './types'
import { pluginRegistry } from './registry'

/**
 * 열고 닫는 표면 슬롯(sidepanel/dashboard/popup)의 활성 상태를 관리한다.
 * 한 번에 한 표면만 열린다 — open 시 이전 표면을 대체한다.
 */
export function usePluginSurfaces() {
    const activeId = useState<string | null>('plugin-surface-active', () => null)

    const active = computed<PluginManifest | null>(
        () => pluginRegistry.find((p) => p.id === activeId.value) ?? null
    )

    const open = (id: string) => {
        activeId.value = id
    }
    const close = () => {
        activeId.value = null
    }

    return { activeId, active, open, close }
}
