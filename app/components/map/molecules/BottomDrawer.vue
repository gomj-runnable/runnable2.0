<script setup lang="ts">
/**
 * 하단 Drawer 공통 컴포넌트.
 * UDrawer를 감싸 direction, overlay, modal, handle 기본값을 통일한다.
 * 콘텐츠는 default 슬롯으로 전달한다.
 */
withDefaults(
    defineProps<{
        /** Drawer 열림 여부 */
        open: boolean
        /** 배경 오버레이 표시 여부 */
        overlay?: boolean
        /** 모달 모드 (외부 상호작용 차단) 여부 */
        modal?: boolean
        /** 핸들 표시 여부 */
        handle?: boolean
        /** 외부 클릭/ESC로 닫기 허용 여부 */
        dismissible?: boolean
    }>(),
    { overlay: false, modal: false, handle: true, dismissible: true }
)

defineEmits<{
    'update:open': [value: boolean]
}>()
</script>

<template>
    <UDrawer
        :open="open"
        direction="bottom"
        :overlay="overlay"
        :modal="modal"
        :handle="handle"
        :dismissible="dismissible"
        @update:open="$emit('update:open', $event)"
    >
        <template #content>
            <div class="bottom-drawer">
                <slot />
            </div>
        </template>
    </UDrawer>
</template>

<style scoped src="~/assets/css/components/molecules/BottomDrawer.css"></style>
