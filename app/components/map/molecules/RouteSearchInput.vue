<script setup lang="ts">
/**
 * RouteSearchInput — 경로 검색 트리거
 *
 * 클릭 또는 ⌘K 단축키로 검색 모달을 엽니다.
 */
defineProps<{
    placeholder?: string
}>()

const model = defineModel<string>({ default: '' })
const isOpen = ref(false)

function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        isOpen.value = true
    }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
    <button
        type="button"
        class="route-search-trigger"
        aria-label="경로 검색 열기"
        @click="isOpen = true"
    >
        <UIcon name="i-lucide-search" class="route-search-trigger__icon" />
        <span class="route-search-trigger__placeholder">
            {{ placeholder ?? 'Search...' }}
        </span>
        <div class="route-search-trigger__shortcut">
            <kbd class="route-search-trigger__kbd">⌘</kbd>
            <kbd class="route-search-trigger__kbd">K</kbd>
        </div>
    </button>

    <UModal v-model:open="isOpen" :dismissible="true" :overlay="true">
        <template #content>
            <div class="route-search-modal">
                <div class="route-search-modal__input-wrap">
                    <UIcon name="i-lucide-search" class="route-search-modal__icon" />
                    <input
                        ref="inputRef"
                        v-model="model"
                        type="text"
                        class="route-search-modal__input"
                        placeholder="경로 이름으로 검색..."
                        autofocus
                        @keydown.escape="isOpen = false"
                    />
                    <kbd class="route-search-trigger__kbd route-search-trigger__kbd--shrink">
                        esc
                    </kbd>
                </div>
                <div v-if="!model" class="route-search-modal__empty">
                    <UIcon name="i-lucide-map" class="route-search-modal__empty-icon" />
                    <span>저장된 경로를 검색하세요</span>
                </div>
                <div v-else class="route-search-modal__empty">
                    <UIcon name="i-lucide-search-x" class="route-search-modal__empty-icon" />
                    <span>
                        <strong>{{ model }}</strong
                        >에 대한 결과가 없습니다
                    </span>
                </div>
            </div>
        </template>
    </UModal>
</template>

<style scoped src="~/assets/css/components/map/molecules/RouteSearchInput.css"></style>
