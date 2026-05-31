// 탐색(explore) 플러그인 매니페스트 — 공개 경로 검색·미리보기·가져오기 sidepanel 플러그인.
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
