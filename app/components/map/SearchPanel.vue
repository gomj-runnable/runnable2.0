<script setup lang="ts">
import type { BaseNode } from '#shared/types/theme-map'
import { useThemeMap } from '~/composables/useThemeMap'

const emit = defineEmits<{ nodeClick: [node: BaseNode] }>()

const { themeMap } = useThemeMap()

const panelCollapsed = ref(false)
const selectedStation = ref('')
const selectedFloor = ref('')
const keyword = ref('')

const stations = computed(() => themeMap.value?.data.children ?? [])

const floors = computed(() => {
  if (!selectedStation.value) return []
  return stations.value.find((s) => s.id === selectedStation.value)?.children ?? []
})

const filteredTree = computed(() => {
  let result = stations.value

  if (selectedStation.value) {
    result = result.filter((s) => s.id === selectedStation.value)
  }

  result = result.map((s) => {
    let children = s.children ?? []

    if (selectedFloor.value) {
      children = children.filter((f) => f.id === selectedFloor.value)
    }

    if (keyword.value.trim()) {
      children = children.map((f) => ({
        ...f,
        children: (f.children ?? []).filter(
          (fac) => fac.name.includes(keyword.value.trim()) || fac.id.includes(keyword.value.trim())
        )
      }))
    }

    return { ...s, children }
  })

  return result
})

function reset() {
  selectedStation.value = ''
  selectedFloor.value = ''
  keyword.value = ''
}

watch(selectedStation, () => {
  selectedFloor.value = ''
})
</script>

<template>
  <div id="search-panel" :class="{ collapsed: panelCollapsed }">
    <button id="search-panel-toggle" @click="panelCollapsed = !panelCollapsed" />
    <div class="panel-header">
      <h2 class="panel-title">{{ themeMap?.name ?? '주제도 정보조회' }}</h2>
    </div>
    <div class="panel-body">
      <div class="search-section">
        <div class="search-form">
          <div class="filter-group">
            <div class="filter-group-label">역사</div>
            <select v-model="selectedStation" class="filter-select">
              <option value="">전체 역사</option>
              <option v-for="s in stations" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <div class="filter-group-label">구역</div>
            <select v-model="selectedFloor" class="filter-select" :disabled="floors.length === 0">
              <option value="">전체 층</option>
              <option v-for="f in floors" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div class="filter-group">
            <div class="filter-group-label">시설물 검색</div>
            <input
              v-model="keyword"
              type="text"
              class="input sm"
              placeholder="시설물 명칭을 입력해주세요."
            />
          </div>
        </div>
      </div>
      <div class="action-row">
        <button type="button" class="btn btn-outline sm" @click="reset">초기화</button>
        <button type="button" class="btn btn-primary sm" @click="() => {}">검색</button>
      </div>
      <div class="result-list">
        <MapSearchTree :nodes="filteredTree" @node-click="emit('nodeClick', $event)" />
      </div>
    </div>
  </div>
</template>
