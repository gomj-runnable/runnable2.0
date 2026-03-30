<script setup lang="ts">
const { sliderImages } = useMapInteraction()

const collapsed = ref(true)
const viewerSrc = ref('')

// 이미지가 생기면 자동으로 열고, 사라지면 닫는다
watch(
  sliderImages,
  (imgs) => {
    collapsed.value = imgs.length === 0
  },
  { immediate: true }
)

function openViewer(src: string) {
  viewerSrc.value = src
}

function closeViewer() {
  viewerSrc.value = ''
}

// ESC 키로 뷰어 닫기
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeViewer()
  })
})
</script>

<template>
  <!-- 이미지 슬라이더 -->
  <div id="slider" :class="{ collapsed }">
    <button id="slider-toggle" @click="collapsed = !collapsed" />
    <div class="slider-content">
      <div class="slider-image-list">
        <div
          v-for="(img, i) in sliderImages"
          :key="i"
          class="slider-img-card"
          @click="openViewer(img.src)"
        >
          <img :src="img.src" :alt="img.label" />
          <span class="slider-img-label">{{ img.label }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 이미지 전체화면 뷰어 -->
  <div
    class="image-viewer"
    :class="{ open: viewerSrc }"
    role="dialog"
    aria-modal="true"
    @click.self="closeViewer"
  >
    <button type="button" class="image-viewer-close" aria-label="닫기" @click="closeViewer">
      &times;
    </button>
    <img v-if="viewerSrc" :src="viewerSrc" alt="" />
  </div>
</template>

