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
            overlay: 'ds-detail__overlay',
            content: 'ds-detail__content'
        }"
        aria-label="노드 상세 패널"
        @update:open="
            (v) => {
                if (!v) emit('close')
            }
        "
    >
        <template #content>
            <div v-if="node" class="ds-detail">
                <!-- Header -->
                <div class="ds-detail__header">
                    <span class="ds-detail__title">{{ node.label }}</span>
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
                <div v-if="node.kind || node.group" class="ds-detail__badges">
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
                <dl class="ds-detail__meta">
                    <div v-if="node.group" class="ds-detail__row">
                        <dt class="ds-detail__dt">그룹</dt>
                        <dd class="ds-detail__dd">{{ node.group }}</dd>
                    </div>
                    <div v-if="node.kind" class="ds-detail__row">
                        <dt class="ds-detail__dt">종류</dt>
                        <dd class="ds-detail__dd">{{ node.kind }}</dd>
                    </div>
                    <template v-if="node.data">
                        <div v-for="(val, key) in node.data" :key="key" class="ds-detail__row">
                            <dt class="ds-detail__dt">{{ key }}</dt>
                            <dd class="ds-detail__dd">
                                {{ typeof val === 'object' ? JSON.stringify(val) : val }}
                            </dd>
                        </div>
                    </template>
                </dl>
            </div>
        </template>
    </USlideover>
</template>

<style scoped>
/* Overlay: no backdrop needed — panel sits inside the canvas area */
:deep(.ds-detail__overlay) {
    display: none;
}

:deep(.ds-detail__content) {
    position: absolute;
    top: 0;
    right: 0;
    width: 260px;
    height: 100%;
    background: var(--ds-bg-elevated);
    border-left: 1px solid var(--ds-border);
    box-shadow: none;
    border-radius: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ds-border) transparent;
}

/* Panel inner layout */
.ds-detail {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.ds-detail__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--ds-border);
    position: sticky;
    top: 0;
    background: var(--ds-bg-elevated);
    z-index: 1;
}

.ds-detail__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ds-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--ds-font-mono);
}

.ds-detail__badges {
    display: flex;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--ds-border-subtle);
}

.ds-detail__meta {
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
}

.ds-detail__row {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.ds-detail__dt {
    font-family: var(--ds-font-mono);
    font-size: 0.5625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ds-text-muted);
    font-weight: 600;
}

.ds-detail__dd {
    font-family: var(--ds-font-mono);
    font-size: 0.8125rem;
    color: var(--ds-text);
    margin: 0;
    word-break: break-all;
}
</style>
