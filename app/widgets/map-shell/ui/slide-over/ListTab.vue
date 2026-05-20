<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, @typescript-eslint/no-explicit-any */
import RouteListPanel from '~/features/draw-route/ui/RouteListPanel.vue'
import SectionInfoSlideContent from '~/widgets/right-panel/ui/SectionInfoSlideContent.vue'

defineProps<{
    isLoggedIn: boolean
    routeList: any
    currentUserId: string | undefined
    sectionInfo: any
    sectionTotalDistance: number
    sectionTotalTime: number
}>()

const emit = defineEmits<{
    'route-select': [routeId: string]
    'route-edit': [routeId: string]
    'step-back': []
    'go-login': []
}>()
</script>

<template>
    <div class="flex flex-col gap-1">
        <div
            v-if="!isLoggedIn"
            class="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
            <UIcon name="i-lucide-lock" class="size-10 text-[var(--ui-text-dimmed)]" />
            <p class="text-sm text-[var(--ui-text-muted)]">
                내 경로 목록을 보려면 로그인이 필요합니다.
            </p>
            <UButton label="로그인" color="primary" @click="emit('go-login')" />
        </div>
        <SectionInfoSlideContent
            v-else-if="sectionInfo.isOpen.value"
            back-label="경로목록"
            :panel-title="sectionInfo.panelTitle.value"
            :sections="sectionInfo.sections.value"
            :user-paces="sectionInfo.userPaces.value"
            :total-distance="sectionTotalDistance"
            :total-time="sectionTotalTime"
            :is-edit-mode="sectionInfo.isEditMode.value"
            :read-only="sectionInfo.readOnly.value"
            @update:edit-mode="sectionInfo.isEditMode.value = $event"
            @update:pace="sectionInfo.updatePace"
            @update:weight="sectionInfo.updateWeight"
            @update:strategy="sectionInfo.updateStrategy"
            @back="emit('step-back')"
        />
        <template v-else>
            <UInput
                v-model="routeList.searchQuery"
                type="search"
                placeholder="경로 이름으로 검색"
                icon="i-lucide-search"
            />
            <RouteListPanel
                :routes="routeList.filteredRoutes"
                :selected-route-id="routeList.selectedRouteId"
                :current-user-id="currentUserId"
                @select="emit('route-select', $event)"
                @download="routeList.download"
                @edit="emit('route-edit', $event)"
            />
        </template>
    </div>
</template>
