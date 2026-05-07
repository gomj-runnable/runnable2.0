<script setup lang="ts">
import { computed } from '#imports'
import { useDiagramTabs } from '../composables/useDiagramTabs'

const { tabs, activeTab: getActiveTab, goToTab } = useDiagramTabs()

const activeTab = computed(() => getActiveTab())

const activeLabel = computed(() => tabs.find((t) => t.key === activeTab.value)?.label ?? '')
</script>

<template>
    <div class="flex items-center gap-5 h-12 min-w-0 flex-1 overflow-hidden">
        <div class="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap max-md:hidden">
            <span class="font-mono text-xs font-semibold text-muted uppercase tracking-[0.04em]"
                >Diagram Studio</span
            >
            <span class="font-mono text-xs text-dimmed" aria-hidden="true">/</span>
            <span class="font-mono text-xs font-semibold text-highlighted tracking-[0.01em]">{{
                activeLabel
            }}</span>
        </div>

        <nav
            class="flex items-center overflow-x-auto overflow-y-hidden scrollbar-none flex-shrink-0"
            aria-label="다이어그램 유형 선택"
        >
            <UButtonGroup size="sm">
                <UButton
                    v-for="tab in tabs"
                    :key="tab.key"
                    :color="tab.key === activeTab ? 'primary' : 'neutral'"
                    :variant="tab.key === activeTab ? 'solid' : 'ghost'"
                    :aria-current="tab.key === activeTab ? 'page' : undefined"
                    class="gap-1.5"
                    @click="goToTab(tab.key)"
                >
                    <UKbd
                        :value="tab.shortcut"
                        size="sm"
                        :class="tab.key === activeTab ? 'opacity-100' : 'opacity-60'"
                    />
                    <span class="max-[600px]:hidden">{{ tab.label }}</span>
                </UButton>
            </UButtonGroup>
        </nav>
    </div>
</template>
