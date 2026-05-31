// demo-sidepanel 플러그인 매니페스트 — sidepanel 슬롯 동작 검증용 데모.
import { markRaw } from 'vue'
import type { PluginManifest } from '../types'
import DemoSidePanel from './DemoSidePanel.vue'

const manifest: PluginManifest = {
    id: 'demo-sidepanel',
    label: '데모 사이드패널',
    description: 'sidepanel 슬롯 동작을 확인하는 데모입니다.',
    slot: 'sidepanel',
    component: markRaw(DemoSidePanel),
    defaultEnabled: true
}

export default manifest
