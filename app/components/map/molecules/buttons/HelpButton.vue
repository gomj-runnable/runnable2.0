<script setup lang="ts">
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'

withDefaults(
    defineProps<{
        label?: string
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        label: '도움말',
        disabled: false,
        type: 'button'
    }
)

defineEmits<{ click: [] }>()
</script>

<template>
    <IconButton
        icon="i-lucide-circle-help"
        :label="label"
        appearance="plain"
        class="help-button"
        :disabled="disabled"
        :type="type"
        @click="$emit('click')"
    />
</template>

<style scoped src="~/assets/css/components/molecules/buttons/HelpButton.css"></style>
