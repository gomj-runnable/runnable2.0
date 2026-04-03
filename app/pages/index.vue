<script setup lang="ts">
import MapShell from '~/components/map/templates/MapShell.vue'
import MapSidebar from '~/components/map/templates/MapSidebar.vue'
import SidebarActionButton from '~/components/map/molecules/SidebarActionButton.vue'
import SidebarIconButton from '~/components/map/molecules/SidebarIconButton.vue'
import SidebarLogo from '~/components/map/molecules/SidebarLogo.vue'
import SidebarUserProfile from '~/components/map/molecules/SidebarUserProfile.vue'

definePageMeta({ ssr: false, layout: 'map' })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()

onMounted(async () => {
    await init()
})
</script>

<template>
    <MapShell>
        <template #sidebar="{ collapsed, toggleSidebar }">
            <MapSidebar :collapsed="collapsed">
                <template #header>
                    <SidebarLogo v-if="!collapsed" icon="i-lucide-map-pin" label="Runnable" />
                    <div style="display: flex; gap: 2px; margin-left: auto">
                        <SidebarIconButton
                            v-if="!collapsed"
                            icon="i-lucide-search"
                            label="경로 검색"
                        />
                        <SidebarIconButton
                            v-if="!collapsed"
                            icon="i-lucide-list"
                            label="경로 목록"
                        />
                        <SidebarIconButton
                            :icon="
                                collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'
                            "
                            :label="collapsed ? '패널 열기' : '패널 닫기'"
                            @click="toggleSidebar"
                        />
                    </div>
                </template>

                <template #default>
                    <SidebarActionButton icon="i-lucide-plus" @click="() => {}">
                        새 경로
                    </SidebarActionButton>
                </template>

                <template #footer>
                    <SidebarUserProfile @click="() => {}" />
                </template>
            </MapSidebar>
        </template>

        <div id="map" class="map-view" />
    </MapShell>
</template>
