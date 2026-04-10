<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        icon?: string
        label?: string
        appearance?: 'plain' | 'secondary' | 'tinted' | 'prominent'
        role?: 'default' | 'cancel' | 'destructive'
        active?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    { appearance: 'plain', role: 'default', active: false, disabled: false, type: 'button' }
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button icon-button"
        :class="[
            `icon-button--${appearance}`,
            `icon-button--role-${role}`,
            {
                'is-active': active,
                'has-label': !!$slots.default || !!label
            }
        ]"
        :aria-label="label"
        :title="label"
        :disabled="disabled"
        @click="$emit('click', $event)"
    >
        <slot name="icon">
            <UIcon v-if="icon" :name="icon" class="icon-button__icon" />
        </slot>
        <slot>
            <span v-if="label" class="icon-button__label">{{ label }}</span>
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/IconButton.css"></style>
