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

<style scoped>
.sidebar-text-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    background: rgba(244, 251, 255, 0.04);
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    transition:
        color var(--transition),
        background var(--transition),
        border-color var(--transition),
        box-shadow var(--transition);
    flex-shrink: 0;
}

.sidebar-text-btn:hover {
    color: var(--text-on-dark);
    background: var(--surface-hover);
    border-color: rgba(144, 213, 255, 0.34);
    box-shadow: inset 0 0 0 1px rgba(244, 251, 255, 0.08);
}

.sidebar-text-btn--active {
    color: var(--nav-active-color);
    background: var(--nav-active-bg);
    border-color: rgba(87, 185, 255, 0.42);
    box-shadow: inset 0 0 0 1px rgba(144, 213, 255, 0.1);
}

.sidebar-text-btn--active:hover {
    color: var(--nav-active-color);
    background: rgba(144, 213, 255, 0.22);
    border-color: rgba(87, 185, 255, 0.56);
}

.sidebar-text-btn--collapsed {
    width: 100%;
    padding: 8px 0;
    border-radius: 0;
    border: none;
    background: transparent;
    box-shadow: none;
}

.sidebar-text-btn--collapsed:hover {
    border: none;
    background: var(--sidebar-item-hover);
    box-shadow: none;
}

.sidebar-text-btn--collapsed.sidebar-text-btn--active {
    border: none;
    background: var(--sidebar-item-active);
    box-shadow: none;
}

.sidebar-text-btn__icon {
    width: 18px;
    height: 18px;
}

.sidebar-text-btn__label {
    line-height: 1;
}
</style>
