<script setup lang="ts">
/**
 * RouteListItem — 경로 목록 행 아이템 (Nuxt UI 기반)
 *
 * Flat 사용:
 *   <RouteListItem label="한강 러닝" meta="12.4km · 1h 03m" badge="3" />
 *
 * Compound 사용:
 *   <RouteListItem label="한강 러닝">
 *     <template #trailing><UBadge label="완료" color="success" /></template>
 *   </RouteListItem>
 *
 * Props:
 *   label   — 경로 이름
 *   meta    — 거리·시간 등 부가 정보
 *   icon    — 앞쪽 아이콘 (i-lucide-* 형식)
 *   badge   — trailing badge 숫자/텍스트 (flat)
 *   active  — 선택 상태
 */
defineProps<{
    label: string
    meta?: string
    icon?: string
    badge?: string | number
    active?: boolean
}>()

defineEmits<{
    click: []
}>()
</script>

<template>
    <div
        class="route-list-item"
        :class="{ 'route-list-item--active': active }"
        role="button"
        tabindex="0"
        @click="$emit('click')"
        @keydown.enter="$emit('click')"
    >
        <UIcon
            v-if="icon"
            :name="icon"
            class="route-list-item__icon"
        />

        <div class="route-list-item__content">
            <span class="route-list-item__label">{{ label }}</span>
            <span v-if="meta" class="route-list-item__meta">{{ meta }}</span>
        </div>

        <slot name="trailing">
            <UBadge
                v-if="badge !== undefined"
                :label="String(badge)"
                color="neutral"
                variant="soft"
                size="xs"
            />
        </slot>
    </div>
</template>

<style scoped>
.route-list-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
    outline: none;
}

.route-list-item:hover {
    background: var(--sidebar-item-hover);
}

.route-list-item--active {
    background: var(--sidebar-item-active);
}

.route-list-item__icon {
    color: var(--sidebar-icon-color);
    font-size: 15px;
    flex-shrink: 0;
}

.route-list-item__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.route-list-item__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--sidebar-icon-hover);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.route-list-item__meta {
    font-size: 11px;
    color: var(--sidebar-icon-color);
}
</style>
