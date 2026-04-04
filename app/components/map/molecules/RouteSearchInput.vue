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
                    <kbd class="route-search-trigger__kbd" style="flex-shrink: 0">esc</kbd>
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

<style scoped>
/* ── 트리거 버튼 ── */
.route-search-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 0 10px;
    height: 36px;
    background: rgba(244, 251, 255, 0.06);
    border: 1px solid var(--border-subtle);
    outline: 1px solid rgba(144, 213, 255, 0.28);
    outline-offset: 0;
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    transition:
        background var(--transition),
        border-color var(--transition);
    box-sizing: border-box;
}

.route-search-trigger:hover {
    background: var(--surface-hover);
    border-color: rgba(144, 213, 255, 0.34);
    outline-color: rgba(144, 213, 255, 0.42);
}

.route-search-trigger:focus-visible {
    outline-color: rgba(144, 213, 255, 0.64);
}

.route-search-trigger__icon {
    width: 15px;
    height: 15px;
    color: var(--sidebar-icon-color);
    flex-shrink: 0;
}

.route-search-trigger__placeholder {
    flex: 1;
    font-size: 13px;
    color: var(--sidebar-icon-color);
    min-width: 0;
    text-align: left;
}

.route-search-trigger__shortcut {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
}

.route-search-trigger__kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    background: rgba(244, 251, 255, 0.08);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    font-size: 11px;
    color: var(--sidebar-icon-color);
    font-family: inherit;
    line-height: 1;
}

/* ── 모달 내부 ── */
.route-search-modal {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--radius-md);
}

.route-search-modal__input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--sidebar-border);
}

.route-search-modal__icon {
    width: 16px;
    height: 16px;
    color: var(--sidebar-icon-color);
    flex-shrink: 0;
}

.route-search-modal__input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 15px;
    color: var(--text-primary);
    font-family: inherit;
}

.route-search-modal__input::placeholder {
    color: var(--text-muted);
}

.route-search-modal__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    color: var(--text-muted);
    font-size: 13px;
}

.route-search-modal__empty-icon {
    width: 28px;
    height: 28px;
    opacity: 0.4;
}
</style>
