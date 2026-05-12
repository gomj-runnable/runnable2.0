<script setup lang="ts">
import { KEYBOARD_SHORTCUTS } from '../composables/useKeyboardShortcuts'

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
    <UModal
        v-model:open="open"
        title="단축키 도움말"
        description="다이어그램 스튜디오 키보드 단축키 및 마우스 조작"
    >
        <template #body>
            <div class="flex flex-col gap-5 font-mono">
                <section class="flex flex-col gap-2">
                    <h3
                        class="font-mono text-[0.625rem] font-semibold text-dimmed uppercase tracking-[0.1em] m-0"
                    >
                        키보드 단축키
                    </h3>
                    <ul class="list-none m-0 p-0 flex flex-col gap-2">
                        <li
                            v-for="shortcut in KEYBOARD_SHORTCUTS"
                            :key="shortcut.description"
                            class="flex items-center gap-3 text-xs text-default"
                        >
                            <span class="inline-flex items-center gap-1 min-w-[5rem]">
                                <UKbd
                                    v-for="key in shortcut.keys"
                                    :key="key"
                                    :value="key"
                                    size="sm"
                                    color="neutral"
                                    variant="outline"
                                />
                            </span>
                            <span>{{ shortcut.description }}</span>
                        </li>
                    </ul>
                </section>

                <section class="flex flex-col gap-2">
                    <h3
                        class="font-mono text-[0.625rem] font-semibold text-dimmed uppercase tracking-[0.1em] m-0"
                    >
                        마우스 조작
                    </h3>
                    <ul class="list-none m-0 p-0 flex flex-col gap-2">
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="inline-flex items-center gap-1 min-w-[5rem]">
                                <UKbd value="scroll" size="sm" color="neutral" variant="outline" />
                            </span>
                            <span>캔버스 줌</span>
                        </li>
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="inline-flex items-center gap-1 min-w-[5rem]">
                                <UKbd value="drag" size="sm" color="neutral" variant="outline" />
                            </span>
                            <span>캔버스 이동 / 노드 이동</span>
                        </li>
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="inline-flex items-center gap-1 min-w-[5rem]">
                                <UKbd value="click" size="sm" color="neutral" variant="outline" />
                            </span>
                            <span>노드 선택 — 우측 상세 패널 열기</span>
                        </li>
                    </ul>
                </section>

                <section class="flex flex-col gap-2">
                    <h3
                        class="font-mono text-[0.625rem] font-semibold text-dimmed uppercase tracking-[0.1em] m-0"
                    >
                        그룹 색상 (FSD)
                    </h3>
                    <ul class="list-none m-0 p-0 flex flex-col gap-2">
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="w-3 h-3 rounded-sm flex-shrink-0 bg-success" />
                            <span>widgets</span>
                        </li>
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="w-3 h-3 rounded-sm flex-shrink-0 bg-warning" />
                            <span>features</span>
                        </li>
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="w-3 h-3 rounded-sm flex-shrink-0 bg-primary" />
                            <span>entities</span>
                        </li>
                        <li class="flex items-center gap-3 text-xs text-default">
                            <span class="w-3 h-3 rounded-sm flex-shrink-0 bg-info" />
                            <span>shared</span>
                        </li>
                    </ul>
                </section>
            </div>
        </template>
    </UModal>
</template>
