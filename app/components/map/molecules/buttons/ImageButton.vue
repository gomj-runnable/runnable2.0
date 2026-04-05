<script setup lang="ts">
withDefaults(
    defineProps<{
        src?: string
        alt?: string
        label?: string
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        src: undefined,
        alt: '',
        label: undefined,
        disabled: false,
        type: 'button'
    }
)

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button image-button"
        :aria-label="label || alt"
        :title="label || alt"
        :disabled="disabled"
        @click="$emit('click')"
    >
        <slot>
            <img v-if="src" :src="src" :alt="alt" class="image-button__image" />
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/ImageButton.css"></style>
