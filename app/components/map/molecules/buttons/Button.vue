<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        label?: string
        icon?: string
        iconTrailing?: boolean
        appearance?: 'plain' | 'secondary' | 'tinted' | 'prominent'
        role?: 'default' | 'cancel' | 'destructive'
        variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text'
        size?: 'sm' | 'md' | 'lg'
        block?: boolean
        active?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    { iconTrailing: false, role: 'default', variant: 'filled', size: 'md', block: false, active: false, disabled: false, type: 'button' }
)

defineEmits<{ click: [] }>()

const resolvedAppearance = computed(() => {
    if (props.appearance) return props.appearance

    const fallbackMap = {
        elevated: 'secondary',
        filled: 'prominent',
        tonal: 'tinted',
        outlined: 'secondary',
        text: 'plain'
    } as const

    return fallbackMap[props.variant ?? 'filled']
})
</script>

<template>
    <button
        :type="type"
        class="map-button app-button"
        :class="[
            `app-button--${resolvedAppearance}`,
            `app-button--role-${role}`,
            `app-button--${size}`,
            {
                'is-block': block,
                'is-active': active,
                'has-trailing-icon': iconTrailing
            }
        ]"
        :disabled="disabled"
        :aria-label="label"
        @click="$emit('click')"
    >
        <slot name="leading">
            <UIcon
                v-if="icon && !iconTrailing"
                :name="icon"
                class="app-button__icon app-button__icon--leading"
            />
        </slot>
        <slot>
            <span v-if="label" class="app-button__label">{{ label }}</span>
        </slot>
        <slot name="trailing">
            <UIcon
                v-if="icon && iconTrailing"
                :name="icon"
                class="app-button__icon app-button__icon--trailing"
            />
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/Button.css"></style>
