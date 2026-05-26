<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 좌측 SlideOver 패널 shell — USlideover + 4개 탭 라우팅.
 * 탭 콘텐츠는 slide-over/* 컴포넌트에 위임한다.
 */
import { NavKey } from '~/widgets/map-shell/model/nav-key'
import ListTab from './slide-over/ListTab.vue'
import DrawTab from './slide-over/DrawTab.vue'
import ExploreTab from './slide-over/ExploreTab.vue'
import AuthTab from './slide-over/AuthTab.vue'

const props = defineProps<{
    isOpen: boolean
    currentNav: string
    title: string
    description: string
    isLoggedIn: boolean
    routeList: any
    currentUserId: string | undefined
    sectionInfo: any
    sectionTotalDistance: number
    sectionTotalTime: string
    sectionDistances: number[]
    drawing: any
    explore: any
    sigunguOptions: string[]
    dongOptions: string[]
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'route-select': [routeId: string]
    'route-edit': [routeId: string]
    'explore-select': [routeId: string]
    'explore-import': [routeId: string]
    'step-back': []
    'drawing-start': []
    'auth-success': []
    'auth-logout': []
    'go-login': []
}>()

const authTabRef = ref<InstanceType<typeof AuthTab> | null>(null)

watch(
    () => props.currentNav,
    (nav) => {
        if (nav === NavKey.AUTH) authTabRef.value?.reset()
    }
)
</script>

<template>
    <USlideover
        :open="isOpen"
        :title="title"
        :description="description"
        side="left"
        :overlay="false"
        :modal="false"
        :dismissible="false"
        :ui="{ content: 'top-(--ui-header-height)! max-w-[75vw] lg:max-w-sm', header: 'flex!' }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <ListTab
                v-if="currentNav === NavKey.LIST"
                :is-logged-in="isLoggedIn"
                :route-list="routeList"
                :current-user-id="currentUserId"
                :section-info="sectionInfo"
                :section-total-distance="sectionTotalDistance"
                :section-total-time="sectionTotalTime"
                @route-select="emit('route-select', $event)"
                @route-edit="emit('route-edit', $event)"
                @step-back="emit('step-back')"
                @go-login="emit('go-login')"
            />
            <DrawTab
                v-else-if="currentNav === NavKey.DRAW"
                :drawing="drawing"
                :section-distances="sectionDistances"
                @drawing-start="emit('drawing-start')"
            />
            <ExploreTab
                v-else-if="currentNav === NavKey.EXPLORE"
                :explore="explore"
                :section-info="sectionInfo"
                :section-total-distance="sectionTotalDistance"
                :section-total-time="sectionTotalTime"
                :sigungu-options="sigunguOptions"
                :dong-options="dongOptions"
                :current-user-id="currentUserId"
                @route-select="emit('route-select', $event)"
                @explore-select="emit('explore-select', $event)"
                @explore-import="emit('explore-import', $event)"
                @step-back="emit('step-back')"
            />
            <AuthTab
                v-else-if="currentNav === NavKey.AUTH"
                ref="authTabRef"
                @success="emit('auth-success')"
                @logout="emit('auth-logout')"
            />
        </template>
    </USlideover>
</template>
