<script setup lang="ts">
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'

withDefaults(
    defineProps<{
        icon?: string
        label?: string
        size?: 'sm' | 'md' | 'lg'
        appearance?: 'plain' | 'secondary' | 'tinted' | 'prominent'
        role?: 'default' | 'cancel' | 'destructive'
        active?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        icon: undefined,
        label: undefined,
        size: 'md',
        appearance: 'secondary',
        role: 'default',
        active: false,
        disabled: false,
        type: 'button'
    }
)

defineEmits<{ click: [] }>()
</script>

<template>
    <IconButton
        :icon="icon"
        :label="label"
        :appearance="appearance"
        :role="role"
        :active="active"
        :disabled="disabled"
        :type="type"
        class="square-button"
        :class="`square-button--${size}`"
        @click="$emit('click')"
    >
        <slot />
    </IconButton>
</template>

<style scoped src="~/assets/css/components/map/molecules/SquareButton.css"></style>
