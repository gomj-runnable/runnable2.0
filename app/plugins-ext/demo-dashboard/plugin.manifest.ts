// demo-dashboard 플러그인 매니페스트 — dashboard 슬롯 동작 검증용 데모.
import { markRaw } from 'vue'
import type { PluginManifest } from '../types'
import DemoDashboard from './DemoDashboard.vue'

const manifest: PluginManifest = {
    id: 'demo-dashboard',
    label: '데모 대시보드',
    description: 'dashboard 슬롯 동작을 확인하는 데모입니다.',
    slot: 'dashboard',
    component: markRaw(DemoDashboard),
    defaultEnabled: true
}

export default manifest
