<script setup lang="ts">
type SegmentItem = {
    value: string
    label?: string
    icon?: string
    disabled?: boolean
}

const props = withDefaults(
    defineProps<{
        items: readonly SegmentItem[]
        modelValue: string | string[] | null
        multiple?: boolean
        fullWidth?: boolean
    }>(),
    {
        multiple: false,
        fullWidth: false
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | null]
}>()

const isSelected = (value: string) => {
    if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.includes(value)
    }

    return props.modelValue === value
}

const toggleValue = (value: string) => {
    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
        const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value]
        emit('update:modelValue', next)
        return
    }

    emit('update:modelValue', props.modelValue === value ? null : value)
}
</script>

<template>
    <div class="segmented-button" :class="{ 'is-full-width': fullWidth }" role="group">
        <button
            v-for="item in items"
            :key="item.value"
            type="button"
            class="map-button segmented-button__item"
            :class="{ 'is-active': isSelected(item.value) }"
            :disabled="item.disabled"
            :aria-pressed="isSelected(item.value)"
            @click="toggleValue(item.value)"
        >
            <UIcon v-if="item.icon" :name="item.icon" class="segmented-button__icon" />
            <span v-if="item.label" class="segmented-button__label">{{ item.label }}</span>
        </button>
    </div>
</template>

<style scoped src="~/assets/css/components/map/molecules/SegmentedButton.css"></style>
