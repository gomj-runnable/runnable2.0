// 인도(sidewalk) 플러그인 매니페스트 — 선택 지역 보행로를 지도에 표시하는 chip 플러그인.
import { markRaw } from 'vue'
import type { PluginManifest } from '../types'
import SidewalkChip from './SidewalkChip.vue'

const manifest: PluginManifest = {
    id: 'sidewalk',
    label: '인도',
    description: '선택 지역의 인도(보행로)를 지도에 표시합니다.',
    slot: 'chip',
    component: markRaw(SidewalkChip),
    defaultEnabled: true,
    position: 'top-right'
}

export default manifest
