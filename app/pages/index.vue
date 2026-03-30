<script setup lang="ts">
import { themeMapSample } from '#shared/data/theme-map-sample'
import type { BaseNode } from '#shared/types/theme-map'

definePageMeta({ ssr: false, layout: 'map' })

useHead({
  link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { activeModal, featureInfo, damagedFacilities, sliderImages } = useMapInteraction()
const { init, drawPois, highLightPoi, drawPolygon, flyToNode } = useMapInit()
const { setThemeMap, flattenNodes } = useThemeMap()

function handleNodeClick(node: BaseNode) {
  const geom = node?.attribute?.geom
  if (geom && typeof geom !== 'string') drawPolygon(geom)

  if (activeModal.value === null) activeModal.value = 'feature'

  if (activeModal.value === 'damage' && node?.attribute?.damagedFacilities?.length) {
    damagedFacilities.value = node.attribute.damagedFacilities
  }
  if (activeModal.value === 'feature' && node?.attribute?.featureAttribute) {
    featureInfo.value = node.attribute.featureAttribute
  }

  const img = node?.resources?.img
  if (activeModal.value === 'feature' && img) {
    const imgs = Array.isArray(img) ? img : [img]
    sliderImages.value = imgs.map((src, i) => ({ src, label: `이미지 ${i + 1}` }))
  } else if (activeModal.value === 'damage' && node?.attribute?.damagedFacilities?.length) {
    sliderImages.value = node.attribute.damagedFacilities
      .filter((d) => d.image)
      .map((d) => ({ src: d.image, label: `${d['순번']} 이미지` }))
  } else {
    sliderImages.value = []
  }

  highLightPoi(node.id)
  flyToNode(node)
}

onMounted(async () => {
  await init()
  setThemeMap(themeMapSample)
  drawPois(flattenNodes(themeMapSample.data.children))
})
</script>

<template>
  <div id="map" />
  <MapHeader />
  <MapSearchPanel @node-click="handleNodeClick" />
  <MapToolbox />
  <MapSlider />
</template>