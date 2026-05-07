import { defineNuxtPlugin } from '#imports'

// auth gate 등록 슬롯 — 호스트의 diagram-gate.client.ts에서 defineDeveloperGate()를 호출한다.
// 이 plugin 자체는 아무 동작도 하지 않는다. Vue Flow CSS만 여기서 import한다.
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

export default defineNuxtPlugin(() => {})
