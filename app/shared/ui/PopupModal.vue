<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        /** 팝업 표시 여부 */
        open: boolean
        /** 팝업 루트 엘리먼트의 id (aria 연결 및 식별용) */
        popupId: string
        /** 팝업 제목 엘리먼트의 id (aria-labelledby 연결) */
        ariaLabelledby?: string
        /** 배경 딤 오버레이 표시 여부 */
        overlay?: boolean
        /** 오버레이 클릭 시 팝업 닫기 여부 */
        closeOnOverlay?: boolean
        /** Escape 키로 팝업 닫기 여부 */
        closeOnEsc?: boolean
        /** 팝업 열림 시 body 스크롤 잠금 여부 */
        lockBodyScroll?: boolean
        /** Teleport 없이 인라인으로 렌더링할지 여부 */
        inline?: boolean
        /** 팝업 수직 위치 (center: 중앙, bottom: 하단) */
        position?: 'center' | 'bottom'
        /** 패널 엘리먼트에 추가할 CSS 클래스 */
        panelClass?: string
        /** 래퍼 엘리먼트에 추가할 CSS 클래스 */
        wrapperClass?: string
    }>(),
    {
        ariaLabelledby: undefined,
        overlay: true,
        closeOnOverlay: true,
        closeOnEsc: true,
        lockBodyScroll: true,
        inline: false,
        position: 'center',
        panelClass: undefined,
        wrapperClass: undefined
    }
)

const emit = defineEmits<{
    /** 팝업 열림/닫힘 상태 변경 시 새 상태 값을 전달 */
    'update:open': [value: boolean]
}>()

const panelRef = ref<HTMLElement | null>(null)
const hasWindow = typeof window !== 'undefined'

/** #modal-root가 존재하면 해당 노드로, 없으면 body로 Teleport 대상을 결정한다 */
const teleportTarget = computed(() => {
    if (!hasWindow) {
        return 'body'
    }

    return document.getElementById('modal-root') ? '#modal-root' : 'body'
})

/** 팝업을 닫고 부모에 false를 emit 한다 */
const close = () => {
    emit('update:open', false)
}

/** 패널 내 첫 번째 포커스 가능한 엘리먼트로 포커스를 이동한다 */
const focusFirstElement = () => {
    const panel = panelRef.value

    // 패널이 없으면 조기 반환
    if (!panel) {
        return
    }

    // 포커스 가능한 요소 쿼리
    const selector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = panel.querySelector<HTMLElement>(selector)
    ;(focusable ?? panel).focus()
}

/** lockBodyScroll prop에 따라 body overflow를 잠금/해제한다 */
const syncBodyScroll = (locked: boolean) => {
    // SSR 환경이거나 잠금 비활성, 인라인 모드이면 무시
    if (!hasWindow || !props.lockBodyScroll || props.inline) {
        return
    }

    document.body.style.overflow = locked ? 'hidden' : ''
}

/** Escape 키 입력 시 팝업을 닫는다 */
const handleEsc = (event: KeyboardEvent) => {
    if (!props.open || !props.closeOnEsc || event.key !== 'Escape') {
        return
    }

    close()
}

watch(
    () => props.open,
    async (open) => {
        // 열림 상태에 따라 body 스크롤 동기화
        syncBodyScroll(open)

        if (!hasWindow) {
            return
        }

        if (open) {
            // 팝업 열릴 때 Esc 리스너 등록 후 포커스 이동
            window.addEventListener('keydown', handleEsc)
            await nextTick()
            focusFirstElement()
            return
        }

        // 팝업 닫힐 때 Esc 리스너 제거
        window.removeEventListener('keydown', handleEsc)
    }
)

onBeforeUnmount(() => {
    // 컴포넌트 해제 시 이벤트 리스너 정리 및 스크롤 잠금 해제
    if (hasWindow) {
        window.removeEventListener('keydown', handleEsc)
    }
    syncBodyScroll(false)
})
</script>

<template>
    <Teleport v-if="open && !inline" :to="teleportTarget">
        <div
            :id="popupId"
            class="popup-modal-wrapper"
            :class="[`popup-modal-wrapper--${position}`, wrapperClass]"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="ariaLabelledby"
        >
            <button
                v-if="overlay"
                type="button"
                class="popup-modal-wrapper__dimmer"
                aria-label="팝업 닫기"
                @click="closeOnOverlay ? close() : undefined"
            />
            <section ref="panelRef" tabindex="-1" class="popup-modal-panel" :class="panelClass">
                <slot :close="close" />
            </section>
        </div>
    </Teleport>

    <div
        v-else-if="open"
        :id="popupId"
        class="popup-modal-wrapper popup-modal-wrapper--inline"
        :class="[`popup-modal-wrapper--${position}`, wrapperClass]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="ariaLabelledby"
    >
        <button
            v-if="overlay"
            type="button"
            class="popup-modal-wrapper__dimmer"
            aria-label="팝업 닫기"
            @click="closeOnOverlay ? close() : undefined"
        />
        <section ref="panelRef" tabindex="-1" class="popup-modal-panel" :class="panelClass">
            <slot :close="close" />
        </section>
    </div>
</template>

<style scoped src="./PopupModal.css"></style>
