import type { PluginManifest } from './types'

interface FeaturePref {
    pluginId: string
    enabled: boolean
}

/**
 * 현재 사용자의 플러그인 활성 선호를 보관/조회한다.
 * 미로그인이거나 미설정인 플러그인은 manifest.defaultEnabled 로 폴백한다.
 */
export function usePluginPrefs() {
    const prefs = useState<Record<string, boolean>>('plugin-prefs', () => ({}))

    /** 서버에서 현재 사용자 prefs 를 불러와 상태에 반영한다. 미로그인/실패 시 빈 맵(=기본값). */
    async function load() {
        try {
            const list = await $fetch<FeaturePref[]>('/api/me/feature-prefs')
            const map: Record<string, boolean> = {}
            for (const p of list) map[p.pluginId] = p.enabled
            prefs.value = map
        } catch {
            prefs.value = {}
        }
    }

    /** manifest 의 활성 여부. user pref 우선, 없으면 defaultEnabled. */
    function isEnabled(plugin: PluginManifest): boolean {
        return prefs.value[plugin.id] ?? plugin.defaultEnabled
    }

    return { prefs, load, isEnabled }
}
