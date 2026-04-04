<script setup lang="ts">
/**
 * SidebarTextButton — 텍스트 탭 버튼
 *
 * 확장 상태: 텍스트만 표시
 * 축소 상태: 아이콘만 표시(툴팁 사용)
 *
 * Props:
 *   icon      — Iconify 아이콘 이름 (축소 시 사용)
 *   label     — 버튼 텍스트
 *   active    — 활성 상태
 *   collapsed — 사이드바 축소 여부
 */
defineProps<{
    icon: string
    label: string
    active?: boolean
    collapsed?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        type="button"
        class="sidebar-text-btn"
        :class="{
            'sidebar-text-btn--active': active,
            'sidebar-text-btn--collapsed': collapsed
        }"
        :aria-label="label"
        :title="label"
        @click="$emit('click')"
    >
        <UIcon v-if="collapsed" :name="icon" class="sidebar-text-btn__icon" />
        <span v-if="!collapsed" class="sidebar-text-btn__label">{{ label }}</span>
    </button>
</template>

<style scoped src="~/assets/css/components/map/molecules/SidebarTextButton.css"></style>
