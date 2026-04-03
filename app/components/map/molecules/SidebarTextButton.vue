<script setup lang="ts">
/**
 * SidebarTextButton — 텍스트 탭 버튼
 *
 * 확장 상태: 텍스트만 표시
 * 축소 상태: 아이콘 + 텍스트(툴팁) 표시
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
            'sidebar-text-btn--collapsed': collapsed,
        }"
        :aria-label="label"
        :title="label"
        @click="$emit('click')"
    >
        <UIcon :name="icon" class="sidebar-text-btn__icon" />
        <span v-if="!collapsed" class="sidebar-text-btn__label">{{ label }}</span>
    </button>
</template>

<style scoped>
.sidebar-text-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    color: var(--sidebar-icon-color);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    transition: color var(--transition), background var(--transition);
    flex-shrink: 0;
}

.sidebar-text-btn:hover {
    color: var(--sidebar-icon-hover);
    background: var(--sidebar-item-hover);
}

.sidebar-text-btn--active {
    color: var(--nav-active-color);
    background: var(--nav-active-bg);
}

.sidebar-text-btn--active:hover {
    color: var(--nav-active-color);
    background: var(--nav-active-bg);
}

.sidebar-text-btn--collapsed {
    width: 100%;
    padding: 8px 0;
    border-radius: 0;
}

.sidebar-text-btn__icon {
    width: 18px;
    height: 18px;
}

.sidebar-text-btn__label {
    line-height: 1;
}
</style>
