<script setup lang="ts">
import type { DiagramNode } from '../../runtime/types'

const props = defineProps<{
    node?: DiagramNode | null
}>()

const emit = defineEmits<{
    close: []
}>()

const isOpen = computed(() => !!props.node)
</script>

<template>
    <!-- USlideover: right-side slide-in panel -->
    <USlideover
        :open="isOpen"
        side="right"
        :ui="{
            overlay: 'hidden max-sm:block max-sm:bg-black/50',
            content:
                'absolute top-0 right-0 h-full w-[260px] shadow-none rounded-none overflow-y-auto max-sm:fixed max-sm:w-full max-sm:max-w-full max-sm:h-dvh'
        }"
        aria-label="노드 상세 패널"
        @update:open="
            (v) => {
                if (!v) emit('close')
            }
        "
    >
        <template #content>
            <div v-if="node" class="flex flex-col h-full">
                <!-- Header -->
                <div
                    class="flex items-center justify-between px-4 py-3 border-b border-default sticky top-0 bg-elevated z-10"
                >
                    <span
                        class="text-sm font-semibold font-mono overflow-hidden text-ellipsis whitespace-nowrap"
                        >{{ node.label }}</span
                    >
                    <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        aria-label="패널 닫기"
                        @click="emit('close')"
                    />
                </div>

                <!-- Node kind / group badges -->
                <div
                    v-if="node.kind || node.group"
                    class="flex gap-1.5 px-4 py-2 flex-wrap border-b border-default"
                >
                    <UBadge
                        v-if="node.group"
                        :label="node.group"
                        color="primary"
                        variant="soft"
                        size="xs"
                    />
                    <UBadge
                        v-if="node.kind"
                        :label="node.kind"
                        color="neutral"
                        variant="outline"
                        size="xs"
                    />
                </div>

                <!-- Meta data list -->
                <dl class="px-4 py-3 flex flex-col gap-2 m-0">
                    <div v-if="node.group" class="flex flex-col gap-px">
                        <dt
                            class="font-mono text-[0.5625rem] uppercase tracking-[0.05em] text-muted font-semibold"
                        >
                            그룹
                        </dt>
                        <dd class="font-mono text-[0.8125rem] m-0 break-all">{{ node.group }}</dd>
                    </div>
                    <div v-if="node.kind" class="flex flex-col gap-px">
                        <dt
                            class="font-mono text-[0.5625rem] uppercase tracking-[0.05em] text-muted font-semibold"
                        >
                            종류
                        </dt>
                        <dd class="font-mono text-[0.8125rem] m-0 break-all">{{ node.kind }}</dd>
                    </div>
                    <template v-if="node.data">
                        <div
                            v-for="(val, key) in node.data"
                            :key="key"
                            class="flex flex-col gap-px"
                        >
                            <dt
                                class="font-mono text-[0.5625rem] uppercase tracking-[0.05em] text-muted font-semibold"
                            >
                                {{ key }}
                            </dt>
                            <dd class="font-mono text-[0.8125rem] m-0 break-all">
                                {{ typeof val === 'object' ? JSON.stringify(val) : val }}
                            </dd>
                        </div>
                    </template>
                </dl>
            </div>
        </template>
    </USlideover>
</template>
