<script setup lang="ts">
/**
 * 러닝 경로 제작 서비스의 메인 페이지.
 * 레이아웃 배치, 네비게이션, 키보드 단축키만 담당한다.
 */
import type { CesiumViewer } from '~/shared/lib/useWindow'
import MapShell from '~/widgets/map-shell/ui/MapShell.vue'
import MapSidebar from '~/widgets/map-shell/ui/MapSidebar.vue'
import MapFooter from '~/widgets/map-shell/ui/MapFooter.vue'
import MapOverlays from '~/widgets/map-shell/ui/MapOverlays.vue'
import SlideOverContent from '~/widgets/map-shell/ui/SlideOverContent.vue'
import RouteSaveModal from '~/features/draw-route/ui/RouteSaveModal.vue'
import RouteCompareModal from '~/features/route-compare/ui/RouteCompareModal.vue'
import { useRouteCompareSideeffect } from '~/features/route-compare/api/useRouteCompareSideeffect'
import { useViewModeSideeffect } from '~/features/view-mode/api/useViewModeSideeffect'
import { useGraphicQualitySideeffect } from '~/features/graphic-quality/api/useGraphicQualitySideeffect'
import FloatingActionMenu from '~/shared/ui/FloatingActionMenu.vue'
import { NavKey } from '~/widgets/map-shell/model/nav-key'
import { useSlideOverNav } from '~/widgets/map-shell/model/useSlideOverNav'
import { useRouteMapFacade } from '~/widgets/map-shell/model/useRouteMapFacade'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'
import { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import { useExploreRouteActions } from '~/features/explore/model/useExploreRouteActions'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { useMapActions } from '~/shared/lib/map/useMapActions'
import { useOverlayContext } from '~/widgets/map-shell/model/useOverlayContext'
import { useFabGroups } from '~/widgets/map-shell/model/useFabGroups'
import { useMapFeatureInit } from '~/widgets/map-shell/model/useMapFeatureInit'
import { useRouteSelectionFlow } from '~/widgets/map-shell/model/useRouteSelectionFlow'

definePageMeta({ ssr: false })
useHead({ link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }] })

const notification = useNotificationStore()
const viewer = shallowRef<CesiumViewer | null>(null)
const routeInfoStore = useRouteInfoStore()
const routeInfoEffect = useRouteInfoSideeffect(viewer)
const routeDrawStore = useRouteDrawStore()

const facade = useRouteMapFacade(viewer, {
    onAfterSave: async (routeId) => {
        await routeInfoEffect.saveLocalRouteInfos(routeId)
    }
})
const {
    activeNav,
    drawing,
    saveModal,
    routeList,
    elevationChart,
    closing,
    exploreSelectRoute,
    hideRoutePolylines,
    showRoutePolylines,
    showRouteInfoGuide,
    fetchRoutes
} = facade

const features = useMapFeatureInit({
    viewer,
    drawing,
    routeDrawStore,
    notification,
    hideRoutePolylines,
    showRoutePolylines
})
const { authStore, authEffect } = features.auth
const { facility, facilityEffect, elevation, gradient } = features.mapLayers

const slideOver = useSlideOverNav(activeNav)
const showDrawingHelpModal = ref(false)
const compareEffect = useRouteCompareSideeffect()

// 헤더 버튼(2D/3D 토글·그래픽 품질)이 변경하는 store 상태를 viewer에 반영하는 공통 컨텍스트 sideeffect
useViewModeSideeffect({ viewer })
useGraphicQualitySideeffect({ viewer })

// 탐색은 사이드패널 플러그인으로 분리됐지만, 선택 경로 ID는 store(useState) 기반 전역 상태라
// 코어도 동일 인스턴스를 통해 오버레이 컨텍스트(EXPLORE_SELECTED)를 판별한다.
const explore = useExploreSearchSideeffect()

const { overlayContext, showRouteInfoChip } = useOverlayContext({
    activeNav,
    sectionDraft: computed(() => drawing.sectionDraft),
    selectedRouteId: routeList.selectedRouteId,
    exploreSelectedRouteId: computed(() => explore.selectedRouteId.value),
    routeInfoStore,
    routeInfoEffect
})

const flow = useRouteSelectionFlow({
    routeDrawStore,
    routeList,
    slideOver,
    activeNav,
    routeInfoStore,
    routeInfoEffect
})
const {
    sectionInfo,
    sectionDistances,
    sectionTotalDistance,
    sectionTotalTime,
    showStepBackConfirm,
    slideOverTitle,
    slideOverDescription,
    handleStepBack,
    confirmStepBack,
    handleRouteSelect,
    handleRouteEdit
} = flow

const { fabGroups, fabNearbyVisible } = useFabGroups({
    mapLayers: features.mapLayers,
    overlayContext,
    elevationChart,
    activeNav,
    closing,
    routeInfoStore,
    showRouteInfoChip
})
const { districtEffect, handleExploreSelect, handleExploreImport } = useExploreRouteActions({
    activeNav,
    explore,
    exploreSelectRoute,
    sectionInfo,
    routeList,
    notification
})

// 탐색 사이드패널 플러그인이 코어 facade 액션을 호출할 수 있도록 전역 등록한다.
useMapActions().registerExploreActions({
    selectRoute: handleExploreSelect,
    importRoute: handleExploreImport
})

onMounted(async () => {
    await districtEffect.init()
    if (authStore.isLoggedIn.value) await fetchRoutes()
})

defineShortcuts({
    escape: () => {
        if (drawing.isDrawingActive) drawing.finish()
        else if (slideOver.isOpen.value) slideOver.close()
    },
    meta_s: {
        handler: () => {
            if (drawing.sectionDraft) drawing.openSaveModal()
        },
        usingInput: true
    }
})

const handleRouteInfoSubmit = async (payload: { name: string; description: string }) => {
    const pos = routeInfoEffect.clickedPosition.value
    if (!pos) return
    const input = {
        ...payload,
        geom: {
            type: 'Point' as const,
            coordinates:
                pos.elevation != null ? [pos.lng, pos.lat, pos.elevation] : [pos.lng, pos.lat]
        }
    }
    if (routeList.selectedRouteId) {
        try {
            await routeInfoEffect.submitRouteInfo(routeList.selectedRouteId, input)
        } catch {
            notification.notify({
                title: '경로정보 등록 실패',
                message: '경로정보 등록에 실패했습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    } else {
        routeInfoStore.addLocalRouteInfo(input)
        routeInfoEffect.cancelAdding()
    }
}

watch(
    () => drawing.isDrawingActive,
    (v) => {
        if (v && window.matchMedia('(max-width: 1023px)').matches) showDrawingHelpModal.value = true
    }
)
</script>

<template>
    <div class="index-page">
        <MapShell>
            <template #sidebar>
                <MapSidebar
                    :active-nav="slideOver.lastActive.value"
                    :is-logged-in="authStore.isLoggedIn.value"
                    :user-role="authStore.user.value?.role"
                    @select="slideOver.select"
                />
            </template>
            <template #default><div id="map" class="map-view" /></template>
            <template #footer><MapFooter :label="features.camera.footerLabel.value" /></template>
            <template #overlay>
                <MapOverlays
                    v-bind="{
                        slideOverOpen: slideOver.isOpen.value,
                        elevation,
                        facility,
                        facilityEffect,
                        viewerReady: !!viewer,
                        showRouteInfoChip,
                        overlayContext,
                        elevationChart,
                        closing,
                        drawing,
                        activeNav,
                        gradient,
                        routeInfoEffect,
                        routeInfoStore,
                        showRouteInfoGuide
                    }"
                    @toggle-elevation-chart="elevationChart.setOpen(!elevationChart.open)"
                    @route-info-submit="handleRouteInfoSubmit"
                    @close-route-info-guide="showRouteInfoGuide = false"
                >
                    <template #drawing-help-modal>
                        <UModal
                            v-model:open="showDrawingHelpModal"
                            title="경로 그리기 안내"
                            :ui="{ footer: 'justify-end' }"
                        >
                            <template #body>
                                <div class="flex flex-col gap-3 text-sm">
                                    <p>
                                        <UIcon
                                            name="i-lucide-hand"
                                            class="size-5 text-(--ui-primary)"
                                        />
                                        <strong>지도를 탭</strong>하여 경로 구간을 추가하세요.
                                    </p>
                                    <p>
                                        <UIcon
                                            name="i-lucide-check-circle"
                                            class="size-5 text-(--ui-primary)"
                                        />
                                        구간 2개 이상 추가 후 <strong>"경로 완성"</strong> 버튼을
                                        누르세요.
                                    </p>
                                </div>
                            </template>
                            <template #footer
                                ><UButton label="확인" @click="showDrawingHelpModal = false"
                            /></template>
                        </UModal>
                    </template>
                </MapOverlays>
            </template>
        </MapShell>

        <SlideOverContent
            :is-open="slideOver.isOpen.value"
            :current-nav="slideOver.current.value ?? ''"
            :title="slideOverTitle"
            :description="slideOverDescription"
            :is-logged-in="authStore.isLoggedIn.value"
            :route-list="routeList"
            :current-user-id="authStore.user.value?.id"
            :section-info="sectionInfo"
            :section-total-distance="sectionTotalDistance"
            :section-total-time="sectionTotalTime"
            :section-distances="sectionDistances"
            :drawing="drawing"
            @update:open="slideOver.isOpen.value = $event"
            @route-select="handleRouteSelect"
            @route-edit="handleRouteEdit"
            @step-back="handleStepBack"
            @drawing-start="drawing.start()"
            @auth-success="fetchRoutes()"
            @auth-logout="authEffect.logout()"
            @go-login="slideOver.select(NavKey.AUTH)"
        />

        <UModal v-model:open="showStepBackConfirm" title="구간정보 닫기">
            <template #body
                ><p class="text-sm text-[var(--ui-text-muted)]">
                    구간정보를 닫으면 현재 설정한 내용이 사라집니다. 돌아가시겠습니까?
                </p></template
            >
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        variant="outline"
                        color="neutral"
                        label="취소"
                        @click="showStepBackConfirm = false"
                    />
                    <UButton
                        variant="solid"
                        color="error"
                        label="돌아가기"
                        @click="confirmStepBack"
                    />
                </div>
            </template>
        </UModal>

        <div
            v-if="!slideOver.isOpen.value"
            class="fixed top-1/2 left-0 z-30 -translate-y-1/2 max-lg:flex hidden"
        >
            <UButton
                icon="i-lucide-chevron-right"
                size="xs"
                color="neutral"
                variant="solid"
                class="rounded-l-none rounded-r-lg shadow-lg opacity-70"
                aria-label="사이드바 다시 열기"
                @click="slideOver.select(slideOver.lastActive.value)"
            />
        </div>

        <FloatingActionMenu :groups="fabGroups" />
        <div
            v-if="fabNearbyVisible"
            class="fixed bottom-16 right-[5.5rem] z-30 max-lg:block hidden"
        >
            <UButton
                icon="i-lucide-locate"
                label="현재 위치 검색"
                size="sm"
                color="neutral"
                variant="solid"
                @click="facilityEffect.searchNearby()"
            />
        </div>

        <RouteSaveModal
            :open="saveModal.open"
            :title="saveModal.routeForm.title"
            :description="saveModal.routeForm.description"
            :distance="saveModal.routeDistance"
            :is-editing="!!saveModal.editingRouteId"
            @update:open="saveModal.open = $event"
            @update:title="saveModal.routeForm.title = $event"
            @update:description="saveModal.routeForm.description = $event"
            @submit="saveModal.confirm"
        />
        <RouteCompareModal
            :open="compareEffect.isOpen.value"
            :is-loading="compareEffect.isLoading.value"
            :result="compareEffect.result.value"
            :error-message="compareEffect.errorMessage.value"
            @update:open="(v: boolean) => (v ? null : compareEffect.close())"
        />
    </div>
</template>

<style>
.slideover-from-rail[data-state='open'] {
    animation: rail-slide-in 200ms ease-out;
}
.slideover-from-rail[data-state='closed'] {
    animation: rail-slide-out 150ms ease-in;
}
@keyframes rail-slide-in {
    from {
        opacity: 0;
        transform: translateX(-1rem);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
@keyframes rail-slide-out {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(-1rem);
    }
}
</style>
