<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, @typescript-eslint/no-explicit-any */
import RouteListPanel from '~/features/draw-route/ui/RouteListPanel.vue'
import SectionInfoSlideContent from './SectionInfoSlideContent.vue'
import AppEmptyState from '~/shared/ui/AppEmptyState.vue'

defineProps<{
    isLoggedIn: boolean
    routeList: any
    currentUserId: string | undefined
    sectionInfo: any
    sectionTotalDistance: number
    sectionTotalTime: string
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
        <AppEmptyState
            v-if="!isLoggedIn"
            icon="i-lucide-lock"
            title="내 경로 목록을 보려면 로그인이 필요합니다."
        >
            <template #action>
                <UButton label="로그인" color="primary" @click="emit('go-login')" />
            </template>
        </AppEmptyState>
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
