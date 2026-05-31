<script setup lang="ts">
// 뒤로 가기 브레드크럼 + SecondPanel을 감싸는 구간정보 슬라이드 컨텐츠 컴포넌트.
import type { SavedSection } from '#shared/types/route'
import type { UserPace } from '#shared/types/user-route'
import SecondPanel from './SecondPanel.vue'

defineProps<{
    backLabel: string
    panelTitle: string
    sections: SavedSection[]
    userPaces: Record<string, UserPace>
    totalDistance: number
    totalTime: string
    isEditMode: boolean
    readOnly?: boolean
}>()

const emit = defineEmits<{
    'update:editMode': [value: boolean]
    'update:pace': [sectionId: string, pace: number]
    'update:weight': [sectionId: string, weight: number]
    'update:strategy': [sectionId: string, strategy: string]
    back: []
}>()
</script>

<template>
    <div class="flex items-center gap-1.5 mb-2">
        <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            color="neutral"
            size="xs"
            :label="backLabel"
            @click="emit('back')"
        />
        <UIcon name="i-lucide-chevron-right" class="text-[var(--ui-text-dimmed)] size-3" />
        <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">구간정보</span>
    </div>
    <SecondPanel
        :panel-title="panelTitle"
        :sections="sections"
        :user-paces="userPaces"
        :total-distance="totalDistance"
        :total-time="totalTime"
        :is-edit-mode="isEditMode"
        :read-only="readOnly"
        @update:edit-mode="emit('update:editMode', $event)"
        @update:pace="(id, p) => emit('update:pace', id, p)"
        @update:weight="(id, w) => emit('update:weight', id, w)"
        @update:strategy="(id, s) => emit('update:strategy', id, s)"
        @close="emit('back')"
    />
</template>
