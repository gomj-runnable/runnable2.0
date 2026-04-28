<script setup lang="ts">
/**
 * MapSidebar — USidebar 래퍼 (헤더 없음)
 *
 * UHeader가 상단 헤더를 담당하므로 USidebar는 헤더 없이 본문+푸터만 렌더링한다.
 * collapsible="icon" 모드에서 접힘 시 탭 아이콘만 표시된다.
 */
const open = defineModel<boolean>('open', { default: true })
</script>

<template>
    <USidebar
        v-model:open="open"
        collapsible="icon"
        side="left"
        variant="sidebar"
        :ui="{
            gap: 'h-[calc(100%-var(--ui-header-height))]',
            container: 'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))]'
        }"
    >
        <template #default="{ state }">
            <slot :state="state" />
        </template>

        <template #footer="{ state: footerState }">
            <slot name="footer" :state="footerState" />
        </template>
    </USidebar>
</template>
