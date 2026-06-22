<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, @typescript-eslint/no-explicit-any */
/**
 * 지도 위에 표시되는 모든 오버레이 UI를 조합하는 컴포넌트.
 * 부모로부터 facade 객체를 직접 받아 내부에서 바인딩한다.
 */
import MapOverlayAnchors from '~/plugins-ext/MapOverlayAnchors.vue'
import PluginLauncher from '~/plugins-ext/PluginLauncher.vue'
import PluginSurfaceHost from '~/plugins-ext/PluginSurfaceHost.vue'
import FacilityOverlay from '~/widgets/facility-overlay/ui/FacilityOverlay.vue'
import GradientLegend from '~/entities/gradient/ui/GradientLegend.vue'
import RouteElevationModal from '~/features/draw-route/ui/RouteElevationModal.vue'
import RouteOverlayBottomBar from '~/features/draw-route/ui/RouteOverlayBottomBar.vue'
import RouteInfoInputForm from '~/entities/route/ui/RouteInfoInputForm.vue'
import RouteInfoMarkerPopup from '~/entities/route/ui/RouteInfoMarkerPopup.vue'
import FacilityMarkerPopup from '~/entities/facility/ui/FacilityMarkerPopup.vue'

const _props = defineProps<{
    slideOverOpen: boolean
    elevation: any
    facility: any
    facilityEffect: any
    viewerReady: boolean
    showRouteInfoChip: boolean
    overlayContext: any
    elevationChart: any
    closing: any
    drawing: any
    activeNav: string
    gradient: any
    routeInfoEffect: any
    routeInfoStore: any
    showRouteInfoGuide: boolean
}>()

const emit = defineEmits<{
    'toggle-elevation-chart': []
    'route-info-submit': [payload: { name: string; description: string }]
    'close-route-info-guide': []
}>()
</script>

<template>
    <!--
        모든 모서리 오버레이(기존 버튼 + 플러그인 chip)를 공유 앵커 호스트에 배치한다.
        같은 앵커에 놓인 요소는 flex 로 순차 정렬되어 서로 겹치지 않는다.
        chip 플러그인은 MapOverlayAnchors 가 manifest.position 기준으로 자동 주입한다.
    -->
    <MapOverlayAnchors>
        <template #top-right>
            <FacilityOverlay
                :active-types="facility.activeTypes.value"
                :is-loading="facility.isLoading.value"
                :is-searching="facility.isSearching.value"
                :disabled="!viewerReady"
                :show-route-info="showRouteInfoChip"
                @toggle="facility.toggleType($event)"
                @search-nearby="facilityEffect.searchNearby()"
            />
        </template>
        <template #bottom-center>
            <RouteOverlayBottomBar
                v-if="
                    overlayContext.showDrawingTools ||
                    (overlayContext.hasActiveRoute && elevationChart.profile)
                "
                :elevation-chip-label="elevationChart.title"
                :elevation-chip-active="elevationChart.open"
                :elevation-profile="elevationChart.profile"
                :closing-mode="closing.mode"
                :closing-disabled="!drawing.sectionDraft"
                :show-closing="activeNav === '그리기'"
                :gradient-active="gradient.isGradientVisible.value"
                :gradient-difficulty="gradient.currentDifficulty.value"
                @toggle-elevation="emit('toggle-elevation-chart')"
                @update:closing-mode="closing.setMode($event)"
                @toggle-gradient="gradient.toggleGradient()"
            />
        </template>
        <template #bottom-left>
            <GradientLegend
                v-if="gradient.isGradientVisible.value"
                :has-other-legend="elevation.isElevationVisible.value"
            />
        </template>
        <template #bottom-right>
            <PluginLauncher />
        </template>
    </MapOverlayAnchors>
    <PluginSurfaceHost />
    <RouteElevationModal
        :open="elevationChart.open"
        :title="elevationChart.title"
        :profile="elevationChart.profile"
        @update:open="elevationChart.setOpen($event)"
    />
    <RouteInfoInputForm
        v-if="routeInfoEffect.clickedPosition.value"
        :lng="routeInfoEffect.clickedPosition.value.lng"
        :lat="routeInfoEffect.clickedPosition.value.lat"
        :elevation="routeInfoEffect.clickedPosition.value.elevation"
        @submit="emit('route-info-submit', $event)"
        @cancel="routeInfoEffect.cancelAdding()"
    />
    <RouteInfoMarkerPopup
        v-if="
            routeInfoStore.selectedMarkerRouteInfo.value && !routeInfoEffect.clickedPosition.value
        "
        :name="routeInfoStore.selectedMarkerRouteInfo.value.name"
        :description="routeInfoStore.selectedMarkerRouteInfo.value.description"
        :author-name="routeInfoStore.selectedMarkerRouteInfo.value.authorName"
        @close="routeInfoStore.selectedMarkerRouteInfo.value = null"
    />
    <FacilityMarkerPopup
        v-if="facility.selectedFacility.value"
        :facility="facility.selectedFacility.value"
        @close="facility.selectedFacility.value = null"
    />
    <!-- 그리기 완료 후 경로정보 안내 모달 -->
    <UModal
        :open="showRouteInfoGuide"
        title="안내"
        :ui="{ footer: 'justify-center' }"
        @update:open="(v: boolean) => !v && emit('close-route-info-guide')"
    >
        <template #body>
            <p class="text-sm text-center">
                화면을 클릭해 해당 위치에 장소 설명을 추가할 수 있습니다.
            </p>
        </template>
        <template #footer>
            <UButton label="확인" @click="emit('close-route-info-guide')" />
        </template>
    </UModal>
    <!-- 모바일: 드로잉 중 "완료" 플로팅 버튼 -->
    <Teleport to="body">
        <div v-if="drawing.isDrawingActive" class="drawing-finish-btn max-lg:block hidden">
            <UButton
                icon="i-lucide-check"
                label="경로 완성"
                size="lg"
                color="primary"
                class="rounded-full shadow-lg"
                @click="drawing.finish()"
            />
        </div>
    </Teleport>
    <slot name="drawing-help-modal" />
</template>

<style scoped>
.drawing-finish-btn {
    position: fixed;
    bottom: 4rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
}
</style>
