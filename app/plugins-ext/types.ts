import type { Component } from 'vue'

/** 플러그인이 꽂히는 UI 확장 슬롯. */
export type PluginSlot = 'chip' | 'sidepanel' | 'dashboard' | 'popup'

export interface PluginManifest {
    /** 전역 고유 id. user feature prefs 의 키로도 쓰인다. */
    id: string
    /** /settings 에 표시될 이름. */
    label: string
    /** /settings 에 표시될 설명. */
    description: string
    /** 어느 확장 슬롯에 렌더될지. */
    slot: PluginSlot
    /** 슬롯에 렌더될 Vue 컴포넌트. */
    component: Component
    /** user prefs 가 없을 때의 기본 활성 여부. */
    defaultEnabled: boolean
}
