import type { Component } from 'vue'

/** 플러그인이 꽂히는 UI 확장 슬롯. */
type PluginSlot = 'chip' | 'sidepanel' | 'dashboard' | 'popup'

/** chip 슬롯의 8방향 배치 위치. */
export type ChipAnchor =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

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
    /** chip 슬롯 배치 위치. 미지정 시 'top-center'. (chip 외 슬롯에선 무시) */
    position?: ChipAnchor
    /** 같은 앵커 내 정렬 순서(오름차순). 미지정 시 0. (chip 외 슬롯에선 무시) */
    order?: number
}
