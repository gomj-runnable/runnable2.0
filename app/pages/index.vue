<script setup lang="ts">
import MapShell from '~/components/map/templates/MapShell.vue'
import MapSidebar from '~/components/map/templates/MapSidebar.vue'
import SidebarActionButton from '~/components/map/molecules/SidebarActionButton.vue'
import SidebarIconButton from '~/components/map/molecules/SidebarIconButton.vue'
import SidebarLogo from '~/components/map/molecules/SidebarLogo.vue'
import SidebarUserProfile from '~/components/map/molecules/SidebarUserProfile.vue'
import SidebarTextButton from '~/components/map/molecules/SidebarTextButton.vue'
import RouteSearchInput from '~/components/map/molecules/RouteSearchInput.vue'

definePageMeta({ ssr: false, layout: 'map' })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()

onMounted(async () => {
    await init()
})

const searchQuery = ref('')
const activeNav = ref('목록')

const navItems = [
    { icon: 'i-lucide-list', label: '목록' },
    { icon: 'i-lucide-pencil', label: '그리기' },
    { icon: 'i-lucide-users', label: '친구' },
] as const
</script>

<template>
    <MapShell>
        <template #sidebar="{ collapsed, toggleSidebar }">
            <MapSidebar :collapsed="collapsed">
                <template #header>
                    <SidebarLogo v-if="!collapsed" icon="i-lucide-map-pin" label="Runnable" />
                    <div style="display: flex; gap: 2px; margin-left: auto">
                        <SidebarIconButton
                            :icon="
                                collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'
                            "
                            :label="collapsed ? '패널 열기' : '패널 닫기'"
                            @click="toggleSidebar"
                        />
                    </div>
                </template>

                <template #subheader>
                    <div v-if="!collapsed" class="sidebar-nav-tabs">
                        <SidebarTextButton
                            v-for="item in navItems"
                            :key="item.label"
                            :icon="item.icon"
                            :label="item.label"
                            :active="activeNav === item.label"
                            @click="activeNav = item.label"
                        />
                    </div>
                    <div v-else class="sidebar-nav-icons">
                        <SidebarTextButton
                            v-for="item in navItems"
                            :key="item.label"
                            :icon="item.icon"
                            :label="item.label"
                            :active="activeNav === item.label"
                            :collapsed="true"
                            @click="activeNav = item.label"
                        />
                    </div>
                </template>

                <template #default>
                    <template v-if="activeNav === '목록'">
                        <RouteSearchInput v-model="searchQuery" />
                        <SidebarActionButton icon="i-lucide-plus" @click="() => {}">
                            새 경로
                        </SidebarActionButton>
                    </template>
                </template>

                <template #footer>
                    <SidebarUserProfile @click="() => {}" />
                </template>
            </MapSidebar>
        </template>

        <div id="map" class="map-view" />
    </MapShell>
</template>

<style scoped>
.sidebar-nav-tabs {
    display: flex;
    flex-direction: row;
    gap: 2px;
    padding: 6px 8px;
}

.sidebar-nav-icons {
    display: flex;
    flex-direction: column;
    align-items: stretch;
}
</style>
