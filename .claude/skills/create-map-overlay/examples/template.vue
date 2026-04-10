<script setup lang="ts">
/**
 * {Name}Overlay — MapShell #overlay 슬롯용 부유 컨트롤 패널
 *
 * 사용처: app/pages/index.vue → MapShell #overlay
 * CSS:    app/assets/css/components/templates/{Name}Overlay.css
 */

// 1. props: store에서 전달받는 상태
const props = defineProps<{
    // activeMode: SomeMode
    // selectedValue: string
}>()

// 2. emit: 상태 변경을 상위로 전달
const emit = defineEmits<{
    // 'update:activeMode': [mode: SomeMode]
    // 'update:selectedValue': [value: string]
}>()

// 3. 내부 sub-modal 상태 (로컬 ref)
// const isPickerOpen = ref(false)
</script>

<template>
    <div class="{name}-overlay">
        <div class="{name}-overlay__topbar">
            <div class="{name}-overlay__controls">
                <!-- molecule 컴포넌트를 배치 -->
                <!-- <ModeToggle :model-value="activeMode" @update:model-value="emit('update:activeMode', $event)" /> -->

                <!-- 내부 sub-modal 예시 -->
                <!-- <div class="{name}-overlay__picker-wrap">
                    <button class="{name}-overlay__picker-toggle" @click="isPickerOpen = !isPickerOpen">
                        <span class="i-lucide-settings" />
                        <span>{{ selectedValue }}</span>
                    </button>
                    <PopupModal :open="isPickerOpen" @update:open="isPickerOpen = $event">
                        <PickerContent />
                    </PopupModal>
                </div> -->

                <!-- Legend/Info 컴포넌트 -->
                <!-- <SomeLegend :active-mode="activeMode" /> -->
            </div>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/{Name}Overlay.css"></style>
