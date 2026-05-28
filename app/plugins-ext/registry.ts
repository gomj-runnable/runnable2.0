import type { PluginManifest, PluginSlot } from './types'
import demoCoords from './demo-coords/plugin.manifest'

/** 빌드 시점에 정적으로 등록된 플러그인 목록. */
export const pluginRegistry: PluginManifest[] = [demoCoords]

/**
 * 주어진 슬롯에서 렌더할 플러그인 목록.
 * 현재는 defaultEnabled 기준. user prefs 필터는 epic #350 PR4 에서 결선한다.
 */
export function getEnabledPlugins(slot: PluginSlot): PluginManifest[] {
    return pluginRegistry.filter((p) => p.slot === slot && p.defaultEnabled)
}
