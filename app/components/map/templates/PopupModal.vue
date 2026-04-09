<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        open: boolean
        popupId: string
        ariaLabelledby?: string
        overlay?: boolean
        closeOnOverlay?: boolean
        closeOnEsc?: boolean
        lockBodyScroll?: boolean
        inline?: boolean
        position?: 'center' | 'bottom'
        panelClass?: string
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
    'update:open': [value: boolean]
}>()

const panelRef = ref<HTMLElement | null>(null)
const hasWindow = typeof window !== 'undefined'

const teleportTarget = computed(() => {
    if (!hasWindow) {
        return 'body'
    }

    return document.getElementById('modal-root') ? '#modal-root' : 'body'
})

const close = () => {
    emit('update:open', false)
}

const focusFirstElement = () => {
    const panel = panelRef.value

    if (!panel) {
        return
    }

    const selector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = panel.querySelector<HTMLElement>(selector)
    ;(focusable ?? panel).focus()
}

const syncBodyScroll = (locked: boolean) => {
    if (!hasWindow || !props.lockBodyScroll || props.inline) {
        return
    }

    document.body.style.overflow = locked ? 'hidden' : ''
}

const handleEsc = (event: KeyboardEvent) => {
    if (!props.open || !props.closeOnEsc || event.key !== 'Escape') {
        return
    }

    close()
}

watch(
    () => props.open,
    async (open) => {
        syncBodyScroll(open)

        if (!hasWindow) {
            return
        }

        if (open) {
            window.addEventListener('keydown', handleEsc)
            await nextTick()
            focusFirstElement()
            return
        }

        window.removeEventListener('keydown', handleEsc)
    }
)

onBeforeUnmount(() => {
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

<style scoped src="~/assets/css/components/templates/PopupModal.css"></style>
