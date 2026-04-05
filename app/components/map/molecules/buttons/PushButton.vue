<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'

withDefaults(
    defineProps<{
        label?: string
        icon?: string
        iconTrailing?: boolean
        emphasized?: boolean
        role?: 'default' | 'cancel' | 'destructive'
        size?: 'sm' | 'md' | 'lg'
        block?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        label: undefined,
        icon: undefined,
        iconTrailing: false,
        emphasized: false,
        role: 'default',
        size: 'md',
        block: false,
        disabled: false,
        type: 'button'
    }
)

defineEmits<{ click: [] }>()
</script>

<template>
    <Button
        :label="label"
        :icon="icon"
        :icon-trailing="iconTrailing"
        :appearance="emphasized ? 'prominent' : 'secondary'"
        :role="role"
        :size="size"
        :block="block"
        :disabled="disabled"
        :type="type"
        class="push-button"
        @click="$emit('click')"
    >
        <slot />
    </Button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/PushButton.css"></style>
