import { markRaw } from 'vue'
import type { PluginManifest } from '../types'
import DemoCoordsChip from './DemoCoordsChip.vue'

const manifest: PluginManifest = {
    id: 'demo-coords',
    label: '플러그인 데모',
    description: '플러그인 확장 슬롯이 동작하는지 확인하는 데모 chip 입니다.',
    slot: 'chip',
    component: markRaw(DemoCoordsChip),
    defaultEnabled: true,
    position: 'top-center'
}

export default manifest
