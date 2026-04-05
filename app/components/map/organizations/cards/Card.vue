<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
    defineProps<{
        title?: string
        eyebrow?: string
        description?: string
        meta?: string
        interactive?: boolean
        selected?: boolean
        disabled?: boolean
        href?: string
        as?: 'article' | 'section' | 'div'
    }>(),
    {
        title: undefined,
        eyebrow: undefined,
        description: undefined,
        meta: undefined,
        interactive: false,
        selected: false,
        disabled: false,
        href: undefined,
        as: 'article'
    }
)

defineEmits<{
    click: [event: MouseEvent]
}>()

const slots = useSlots()

const tagName = computed(() => {
    if (props.href && !props.disabled) {
        return 'a'
    }

    if (props.interactive && !props.disabled) {
        return 'button'
    }

    return props.as
})

const cardTypeClass = computed(() => {
    if (props.disabled) {
        return 'is-disabled'
    }

    if (props.selected) {
        return 'is-selected'
    }

    if (props.interactive || props.href) {
        return 'is-interactive'
    }

    return null
})

const hasHeader = computed(() => {
    return Boolean(props.eyebrow || props.title || slots.eyebrow || slots.title || slots.header)
})

const hasBody = computed(() => {
    return Boolean(props.description || slots.default)
})

const hasFooter = computed(() => {
    return Boolean(props.meta || slots.meta || slots.footer)
})
</script>

<template>
    <component
        :is="tagName"
        class="organization-card"
        :class="cardTypeClass"
        :href="tagName === 'a' ? href : undefined"
        :disabled="tagName === 'button' ? disabled : undefined"
        :aria-disabled="tagName !== 'button' && disabled ? 'true' : undefined"
        @click="$emit('click', $event)"
    >
        <div class="organization-card__glow" aria-hidden="true" />

        <header v-if="hasHeader" class="organization-card__header">
            <slot name="header">
                <p v-if="eyebrow || slots.eyebrow" class="organization-card__eyebrow">
                    <slot name="eyebrow">{{ eyebrow }}</slot>
                </p>
                <h3 v-if="title || slots.title" class="organization-card__title">
                    <slot name="title">{{ title }}</slot>
                </h3>
            </slot>
        </header>

        <div v-if="hasBody" class="organization-card__body">
            <slot>
                <p v-if="description" class="organization-card__description">
                    {{ description }}
                </p>
            </slot>
        </div>

        <footer v-if="hasFooter" class="organization-card__footer">
            <slot name="footer">
                <p v-if="meta || slots.meta" class="organization-card__meta">
                    <slot name="meta">{{ meta }}</slot>
                </p>
            </slot>
        </footer>
    </component>
</template>

<style scoped src="~/assets/css/components/organizations/cards/Card.css"></style>
