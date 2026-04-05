<script setup lang="ts">
withDefaults(
    defineProps<{
        icon: string
        label?: string
        size?: 'small' | 'medium' | 'large'
        extended?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        label: undefined,
        size: 'medium',
        extended: false,
        disabled: false,
        type: 'button'
    }
)

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button fab-button"
        :class="[
            `fab-button--${size}`,
            {
                'is-extended': extended
            }
        ]"
        :disabled="disabled"
        @click="$emit('click')"
    >
        <UIcon :name="icon" class="fab-button__icon" />
        <span v-if="extended && label" class="fab-button__label">{{ label }}</span>
    </button>
</template>

<style scoped src="~/assets/css/components/map/molecules/FabButton.css"></style>
