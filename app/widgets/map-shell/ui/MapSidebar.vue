<script setup lang="ts">
import IconButton from '~/shared/ui/buttons/IconButton.vue'

/**
 * MapSidebar — Compound 패턴
 *
 * Flat 사용 (간단한 경우):
 *   <MapSidebar logo-icon="i-lucide-map" logo-label="Runnable" />
 *
 * Compound 사용 (커스텀이 필요한 경우):
 *   <MapSidebar>
 *     <template #header>...</template>
 *     <template #default>...</template>
 *     <template #footer>...</template>
 *   </MapSidebar>
 */
withDefaults(
    defineProps<{
        /** 헤더에 표시할 로고 아이콘 클래스 */
        logoIcon?: string
        /** 헤더에 표시할 로고 레이블 텍스트 */
        logoLabel?: string
        /** 사이드바 접힘 상태 여부 */
        collapsed?: boolean
    }>(),
    {
        logoIcon: undefined,
        logoLabel: undefined,
        collapsed: false
    }
)
</script>

<template>
    <nav class="map-sidebar" role="navigation" :class="{ 'is-collapsed': collapsed }">
        <header class="map-sidebar__header">
            <slot name="header">
                <IconButton :icon="logoIcon" :label="logoLabel" />
            </slot>
        </header>

        <div v-if="$slots.subheader" class="map-sidebar__subheader">
            <slot name="subheader" />
        </div>

        <div class="map-sidebar__content" :class="{ 'is-collapsed': collapsed }">
            <div class="map-sidebar__body">
                <slot />
            </div>
        </div>

        <footer class="map-sidebar__footer" role="toolbar" :class="{ 'is-collapsed': collapsed }">
            <slot name="footer" />
        </footer>
    </nav>
</template>

<style scoped src="./MapSidebar.css"></style>
