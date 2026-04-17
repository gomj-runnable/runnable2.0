<script setup lang="ts">
import { useRightPanelStore, type RightPanelType } from '~/composables/store/useRightPanelStore'
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'

const rightPanel = useRightPanelStore()

const buttons: { key: RightPanelType; icon: string; label: string }[] = [
    { key: 'discover', icon: 'i-lucide-compass', label: '탐색' },
    { key: 'feedback', icon: 'i-lucide-message-circle', label: '피드백' },
    { key: 'simulation', icon: 'i-lucide-play-circle', label: '시뮬레이션' },
    { key: 'weather-recommend', icon: 'i-lucide-cloud-sun', label: '추천' }
]
</script>

<template>
    <div class="right-panel-toggle-group">
        <IconButton
            v-for="btn in buttons"
            :key="btn.key"
            :icon="btn.icon"
            :label="btn.label"
            :class="{ 'is-active': rightPanel.activePanel.value === btn.key }"
            @click="rightPanel.open(btn.key)"
        />
    </div>
</template>

<style scoped>
.right-panel-toggle-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
}

.right-panel-toggle-group :deep(.is-active) {
    background: var(--color-primary-default);
    color: var(--color-on-primary);
}
</style>
