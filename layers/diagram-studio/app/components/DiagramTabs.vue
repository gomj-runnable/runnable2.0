<script setup lang="ts">
import { computed } from '#imports'
import type { TabsItem } from '@nuxt/ui'

export type TabKind = 'user-journey' | 'fsd' | 'composables' | 'classes'

interface TabDef {
    key: TabKind
    label: string
    shortcut: string
}

const TABS_DEF: TabDef[] = [
    { key: 'user-journey', label: 'User Journey', shortcut: '1' },
    { key: 'fsd', label: 'FSD Layers', shortcut: '2' },
    { key: 'composables', label: 'Composable Graph', shortcut: '3' },
    { key: 'classes', label: 'Class Diagrams', shortcut: '4' }
]

const props = defineProps<{
    modelValue: TabKind
}>()

const emit = defineEmits<{
    'update:modelValue': [value: TabKind]
}>()

const tabItems = computed<TabsItem[]>(() =>
    TABS_DEF.map((t) => ({
        value: t.key,
        label: t.label,
        badge: t.shortcut
    }))
)

function onTabChange(val: string | number) {
    emit('update:modelValue', val as TabKind)
}
</script>

<template>
    <UTabs
        :model-value="props.modelValue"
        :items="tabItems"
        :content="false"
        color="neutral"
        variant="link"
        size="sm"
        class="ds-tabs"
        :ui="{
            root: 'ds-tabs__root',
            list: 'ds-tabs__list',
            trigger: 'ds-tabs__trigger',
            indicator: 'ds-tabs__indicator',
            trailingBadge: 'ds-tabs__badge',
            label: 'ds-tabs__label'
        }"
        aria-label="다이어그램 유형 탭"
        @update:model-value="onTabChange"
    />
</template>

<style scoped>
/* Root container aligns with header height */
.ds-tabs {
    height: 48px;
}

:deep(.ds-tabs__root) {
    height: 48px;
    display: flex;
    align-items: stretch;
}

:deep(.ds-tabs__list) {
    height: 48px;
    background: transparent;
    border-radius: 0;
    gap: 0;
    padding: 0;
}

:deep(.ds-tabs__indicator) {
    height: 2px;
    bottom: 0;
    top: auto;
    background: var(--ds-accent);
    border-radius: 0;
}

:deep(.ds-tabs__trigger) {
    height: 48px;
    border-radius: 0;
    padding: 0 1.125rem;
    font-family: var(--ds-font-sans);
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--ds-text-muted);
    border-right: 1px solid var(--ds-border);
    transition:
        color var(--ds-transition),
        background var(--ds-transition);
    white-space: nowrap;
    gap: 0.5rem;
}

:deep(.ds-tabs__trigger:first-child) {
    border-left: 1px solid var(--ds-border);
}

:deep(.ds-tabs__trigger:hover) {
    color: var(--ds-text);
    background: rgba(255, 255, 255, 0.02);
}

:deep(.ds-tabs__trigger[data-state='active']) {
    color: var(--ds-text);
    background: rgba(255, 107, 53, 0.06);
}

:deep(.ds-tabs__trigger[data-state='active'] .ds-tabs__badge) {
    color: var(--ds-accent);
    border-color: var(--ds-accent);
}

:deep(.ds-tabs__label) {
    letter-spacing: 0.005em;
}

/* Badge styled as a small kbd chip */
:deep(.ds-tabs__badge) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-family: var(--ds-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    color: var(--ds-text-dim);
    border: 1px solid var(--ds-border);
    border-radius: 3px;
    background: transparent;
    padding: 0;
    /* reset badge defaults */
    min-width: unset;
    line-height: 1;
    order: -1; /* show before label */
}
</style>
