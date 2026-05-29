import type { PluginManifest } from './types'
import sidewalk from './sidewalk/plugin.manifest'
import demoCoords from './demo-coords/plugin.manifest'
import demoSidePanel from './demo-sidepanel/plugin.manifest'
import demoDashboard from './demo-dashboard/plugin.manifest'
import demoPopup from './demo-popup/plugin.manifest'

/** 빌드 시점에 정적으로 등록된 플러그인 목록. */
export const pluginRegistry: PluginManifest[] = [
    sidewalk,
    demoCoords,
    demoSidePanel,
    demoDashboard,
    demoPopup
]
