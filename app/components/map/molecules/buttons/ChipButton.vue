<script setup lang="ts">
withDefaults(
    defineProps<{
        label?: string
        icon?: string
        iconTrailing?: boolean
        appearance?: 'default' | 'elevated' | 'tinted' | 'outlined'
        size?: 'xs' | 'sm' | 'md' | 'lg'
        active?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    { iconTrailing: false, appearance: 'default', size: 'md', active: false, disabled: false, type: 'button' }
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button chip-button"
        :class="[
            `chip-button--${size}`,
            `chip-button--${appearance}`,
            {
                'is-active': active,
                'has-trailing-icon': iconTrailing
            }
        ]"
        :disabled="disabled"
        :aria-label="label"
        @click="$emit('click', $event)"
    >
        <slot name="leading">
            <UIcon
                v-if="icon && !iconTrailing"
                :name="icon"
                class="chip-button__icon"
            />
        </slot>
        <slot>
            <span v-if="label" class="chip-button__label">{{ label }}</span>
        </slot>
        <slot name="trailing">
            <UIcon
                v-if="icon && iconTrailing"
                :name="icon"
                class="chip-button__icon"
            />
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/ChipButton.css"></style>
