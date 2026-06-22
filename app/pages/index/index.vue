<script setup lang="ts">
/**
 * 목록 탭 panel (path: `/`).
 * 부모 지도 페이지가 provide 한 컨텍스트에서 facade·flow·auth 를 받아 ListTab 에 연결한다.
 */
import { useMapPageContext } from '~/widgets/map-page/model/useMapPageContext'
import { NavKey } from '~/widgets/map-page/model/nav-key'
import ListTab from '~/widgets/map-page/ui/slide-over/ListTab.vue'

const { facade, flow, authStore, selectNav } = useMapPageContext()
const {
    sectionInfo,
    sectionTotalDistance,
    sectionTotalTime,
    handleRouteSelect,
    handleRouteEdit,
    handleStepBack
} = flow
const { isLoggedIn, user } = authStore
</script>

<template>
    <ListTab
        :is-logged-in="isLoggedIn"
        :route-list="facade.routeList"
        :current-user-id="user?.id"
        :section-info="sectionInfo"
        :section-total-distance="sectionTotalDistance"
        :section-total-time="sectionTotalTime"
        @route-select="handleRouteSelect"
        @route-edit="handleRouteEdit"
        @step-back="handleStepBack"
        @go-login="selectNav(NavKey.AUTH)"
    />
</template>
