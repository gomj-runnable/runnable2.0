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
        <UIcon v-if="icon" :name="icon" class="route-list-item__icon" />

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

<style scoped src="~/assets/css/components/map/molecules/RouteListItem.css"></style>
