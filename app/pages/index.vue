<script setup lang="ts">
import { themeMapSample } from '#shared/data/theme-map-sample'

definePageMeta({ ssr: false, layout: 'map' })

useHead({
  link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init, drawPois } = useMapInit()
const { setThemeMap, flattenNodes } = useThemeMap()

onMounted(async () => {
  await init()
  setThemeMap(themeMapSample)
  drawPois(flattenNodes(themeMapSample.data.children))
})
</script>

<template>
  <div id="map" />
</template>
