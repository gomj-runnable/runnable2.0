<script setup lang="ts">
/**
 * MapSidebar — UDashboardSidebar 기반 사이드바
 *
 * Nuxt UI의 UDashboardSidebar를 래핑하여 기존 슬롯 구조(header, subheader, default, footer)를 유지한다.
 * Close/Toggle 아이콘은 header 슬롯 내부에 위치한다.
 */
const collapsed = defineModel<boolean>('collapsed', { default: false })
</script>

<template>
    <UDashboardSidebar
        v-model:collapsed="collapsed"
        collapsible
        side="left"
        :toggle="false"
        :ui="{
            root: 'map-sidebar-root',
            header: 'map-sidebar-header',
            body: 'map-sidebar-body',
            footer: 'map-sidebar-footer'
        }"
    >
        <template #header>
            <slot name="header" />
        </template>

        <template #default>
            <div v-if="$slots.subheader" class="map-sidebar-subheader">
                <slot name="subheader" />
            </div>
            <div class="map-sidebar-content">
                <slot />
            </div>
        </template>

        <template #footer>
            <slot name="footer" />
        </template>
    </UDashboardSidebar>
</template>

<style scoped>
.map-sidebar-root {
    --sidebar-width: var(--size-sidebar-expanded, 320px);
    height: 100%;
}

.map-sidebar-header {
    padding: var(--gap-7, 12px) var(--gap-section-md, 16px) var(--gap-section-sm, 8px);
    min-height: 56px;
}

.map-sidebar-subheader {
    flex-shrink: 0;
    padding-bottom: 0;
}

.map-sidebar-content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--gap-4, 8px);
    display: flex;
    flex-direction: column;
    gap: var(--gap-section-2xs, 4px);
}

.map-sidebar-content::-webkit-scrollbar {
    width: 3px;
}

.map-sidebar-content::-webkit-scrollbar-thumb {
    background: var(--sidebar-border, var(--color-border-default));
    border-radius: 2px;
}

.map-sidebar-footer {
    border-top: 1px solid var(--sidebar-border, var(--color-border-default));
}
</style>
