import type { PluginManifest } from './types'
import demoCoords from './demo-coords/plugin.manifest'

/** 빌드 시점에 정적으로 등록된 플러그인 목록. */
export const pluginRegistry: PluginManifest[] = [demoCoords]
