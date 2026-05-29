import { markRaw } from 'vue'
import type { PluginManifest } from '../types'
import ExplorePanelPlugin from './ExplorePanelPlugin.vue'

const manifest: PluginManifest = {
    id: 'explore',
    label: '탐색',
    description: '공개된 러닝 경로를 검색하고 지도에서 미리보거나 가져옵니다.',
    slot: 'sidepanel',
    component: markRaw(ExplorePanelPlugin),
    defaultEnabled: true
}

export default manifest
