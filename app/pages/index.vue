<script setup lang="ts">
/**
 * 러닝 경로 제작 서비스의 메인 페이지(부모 layout).
 * 지도·facade·오버레이·모달·FAB 를 소유하고, 탭 panel(목록·그리기·탐색)은
 * nested route(`pages/index/*`)로 분리해 `<NuxtPage>`로 렌더한다.
 * 자식 panel 은 `provide`한 컨텍스트로 facade·flow·auth 에 접근한다.
 */
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'
import MapCanvas from '~/widgets/map-page/ui/MapCanvas.vue'
import MapSidebar from '~/widgets/map-page/ui/MapSidebar.vue'
import MapFooter from '~/widgets/map-page/ui/MapFooter.vue'
import MapOverlays from '~/widgets/map-page/ui/MapOverlays.vue'
import AuthTab from '~/widgets/map-page/ui/slide-over/AuthTab.vue'
import RouteSaveModal from '~/features/draw-route/ui/RouteSaveModal.vue'
import RouteCompareModal from '~/features/route-compare/ui/RouteCompareModal.vue'
import { useRouteCompareSideeffect } from '~/features/route-compare/api/useRouteCompareSideeffect'
import { useViewModeSideeffect } from '~/features/view-mode/api/useViewModeSideeffect'
import { useGraphicQualitySideeffect } from '~/features/graphic-quality/api/useGraphicQualitySideeffect'
import { useBaseMapSideeffect } from '~/features/base-map/api/useBaseMapSideeffect'
import FloatingActionMenu from '~/shared/ui/FloatingActionMenu.vue'
import { NavKey, type NavKeyValue } from '~/widgets/map-page/model/nav-key'
import { useSlideOverNav } from '~/widgets/map-page/model/useSlideOverNav'
import { useTabRoute } from '~/widgets/map-page/model/useTabRoute'
import { useRouteMapFacade } from '~/widgets/map-page/model/useRouteMapFacade'
import { MAP_PAGE_CONTEXT } from '~/widgets/map-page/model/useMapPageContext'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'
import { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import { useExploreRouteActions } from '~/features/explore/model/useExploreRouteActions'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { useMapActions } from '~/shared/lib/useMapActions'
import { useOverlayContext } from '~/widgets/map-page/model/useOverlayContext'
import { useFabGroups } from '~/widgets/map-page/model/useFabGroups'
import { useMapFeatureInit } from '~/widgets/map-page/model/useMapFeatureInit'
import { useRouteSelectionFlow } from '~/widgets/map-page/model/useRouteSelectionFlow'

definePageMeta({ ssr: false })
useHead({ link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }] })

// viewer 소유권은 CesiumController(useMapViewer)에 있다. useMapFeatureInit 이 onMounted 에서 등록한다.
const { viewer } = useMapViewer()

// Phase 1. Store 선언
const notification = useNotificationStore() // 알림
const routeInfoStore = useRouteInfoStore() // 경로 정보
const routeDrawStore = useRouteDrawStore() // 그리기

// Phase 2. Sideeffect 선언
const routeInfoEffect = useRouteInfoSideeffect() // facade onAfterSave 에서 사용
const compareEffect = useRouteCompareSideeffect() // 경로 비교 모달
// 헤더 버튼(베이스맵·2D/3D 토글·그래픽 품질)이 변경하는 store 상태를 viewer에 반영하는 공통 컨텍스트 sideeffect
const runtimeConfig = useRuntimeConfig()
useViewModeSideeffect()
useGraphicQualitySideeffect()
useBaseMapSideeffect({ vworldKey: runtimeConfig.public.vworldKey })
// 탐색은 사이드패널 플러그인으로 분리됐지만, 선택 경로 ID는 store(useState) 기반 전역 상태라
// 코어도 동일 인스턴스를 통해 오버레이 컨텍스트(EXPLORE_SELECTED)를 판별한다.
const explore = useExploreSearchSideeffect()

// Phase 3. Facade 선언
// 경로 퍼싸드
const facade = useRouteMapFacade({
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

// Phase 4. 지도 기능 초기화 (viewer 등록 · auth · 레이어)
const features = useMapFeatureInit({
    drawing,
    routeDrawStore,
    notification,
    hideRoutePolylines,
    showRoutePolylines
})
const { authStore, authEffect } = features.auth
const { facility, facilityEffect, elevation, gradient } = features.mapLayers

// Phase 5. 네비게이션 (SlideOver · 탭 라우트)
const slideOver = useSlideOverNav(activeNav)

// nested route path(`/`·`/draw`·`/explore`)를 탭 mode·상태값의 단일 진실 소스로 삼는다.
const { setTab } = useTabRoute({ activeNav, slideOver })

/** Nav Rail 선택 → 목록·그리기는 path 이동으로, 로그인 등은 기존 SlideOver 토글로 처리한다. */
const handleNavSelect = (nav: NavKeyValue) => {
    if (nav === NavKey.LIST) return setTab('list')
    if (nav === NavKey.DRAW) return setTab('draw')
    slideOver.select(nav)
}

// Phase 6. 오버레이 컨텍스트 (경로 의존 오버레이 UI 판별)
const { overlayContext, showRouteInfoChip } = useOverlayContext({
    activeNav,
    sectionDraft: computed(() => drawing.sectionDraft),
    selectedRouteId: routeList.selectedRouteId,
    exploreSelectedRouteId: computed(() => explore.selectedRouteId.value),
    routeInfoStore,
    routeInfoEffect
})

// Phase 7. 경로 선택 플로우 (구간정보 · 단계 되돌리기)
const flow = useRouteSelectionFlow({
    routeDrawStore,
    routeList,
    slideOver,
    activeNav,
    routeInfoStore,
    routeInfoEffect
})
const { sectionInfo, showStepBackConfirm, slideOverTitle, slideOverDescription, confirmStepBack } =
    flow

// Phase 8. FAB 그룹 & 탐색 액션
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

// Phase 9. 자식 panel context 주입
// nested route 자식 panel(목록·그리기·탐색)에 facade·flow·auth·네비게이션 핸들을 내려준다.
provide(MAP_PAGE_CONTEXT, {
    facade,
    flow,
    slideOver,
    authStore,
    selectNav: handleNavSelect,
    fetchRoutes
})

// Phase 10. 생명주기 & 이벤트 핸들러 (마운트 · 단축키 · watch)
// 로그인 탭(AuthTab)은 path가 아닌 좌측 SlideOver 토글로 노출한다. 진입 시 폼을 초기화한다.
const authTabRef = ref<InstanceType<typeof AuthTab> | null>(null)
watch(
    () => slideOver.current.value,
    (nav) => {
        if (nav === NavKey.AUTH) authTabRef.value?.reset()
    }
)

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
        routeInfoStore.addDraftRouteInfo(input)
        routeInfoEffect.cancelAdding()
    }
}

// 모바일에서 그리기 진입 시 그리기 안내 모달 노출
const showDrawingHelpModal = ref(false)
watch(
    () => drawing.isDrawingActive,
    (v) => {
        if (v && window.matchMedia('(max-width: 1023px)').matches) showDrawingHelpModal.value = true
    }
)
</script>

<template>
    <div class="index-page flex flex-col h-screen">
        <!-- 앱 헤더: 로고 + 전역 지도 컨트롤 + nav (MapSidebar 의 UHeader 가 <header> 를 렌더) -->
        <MapSidebar
            :active-nav="slideOver.lastActive.value"
            :is-logged-in="authStore.isLoggedIn.value"
            :user-role="authStore.user.value?.role"
            @select="handleNavSelect"
        />

        <!-- main: 지도 캔버스 + 그 위에 떠 있는 HUD -->
        <main class="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
            <MapCanvas>
                <template #footer
                    ><MapFooter :label="features.camera.footerLabel.value"
                /></template>
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
                                            구간 2개 이상 추가 후
                                            <strong>"경로 완성"</strong> 버튼을 누르세요.
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
            </MapCanvas>
        </main>

        <USlideover
            :open="slideOver.isOpen.value"
            :title="slideOverTitle"
            :description="slideOverDescription"
            side="left"
            :overlay="false"
            :modal="false"
            :dismissible="false"
            :ui="{ content: 'top-(--ui-header-height)! max-w-[75vw] lg:max-w-sm', header: 'flex!' }"
            @update:open="slideOver.isOpen.value = $event"
        >
            <template #body>
                <AuthTab
                    v-if="slideOver.current.value === NavKey.AUTH"
                    ref="authTabRef"
                    @success="fetchRoutes()"
                    @logout="authEffect.logout()"
                />
                <NuxtPage v-else />
            </template>
        </USlideover>

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
                @click="handleNavSelect(slideOver.lastActive.value)"
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
