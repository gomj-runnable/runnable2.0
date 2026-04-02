<script setup lang="ts">
import { themeMapSample } from '#shared/data/theme-map-sample'
import { mapPrimeAction } from '~/composables/action/mapPrimeAction'

definePageMeta({ ssr: false, layout: 'map' })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()
const { setThemeMap, flattenNodes } = useThemeMap()
const { drawPois } = mapPrimeAction()

onMounted(async () => {
    await init()
    setThemeMap(themeMapSample)
    drawPois(flattenNodes(themeMapSample.data.children))
})
</script>

<template>
    <MapShell>
        <template #sidebar>
            <MapSidebar>
                <template #header>
                    <SidebarLogo icon="i-lucide-map-pin" label="Runnable" />
                    <div style="display: flex; gap: 2px;">
                        <SidebarIconButton icon="i-lucide-search" label="경로 검색" />
                        <SidebarIconButton icon="i-lucide-list" label="경로 목록" />
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

        <div id="map" />
    </MapShell>
</template>
