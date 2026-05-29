import { markRaw } from 'vue'
import type { PluginManifest } from '../types'
import DemoPopup from './DemoPopup.vue'

const manifest: PluginManifest = {
    id: 'demo-popup',
    label: '데모 팝업',
    description: 'popup(scrollable) 슬롯 동작을 확인하는 데모입니다.',
    slot: 'popup',
    component: markRaw(DemoPopup),
    defaultEnabled: true
}

export default manifest
