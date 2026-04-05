<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'

type SidebarTabItem = {
    icon: string
    label: string
}

const props = withDefaults(
    defineProps<{
        items: readonly SidebarTabItem[]
        modelValue: string
        collapsed?: boolean
    }>(),
    {
        collapsed: false
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const handleSelect = (label: string) => {
    emit('update:modelValue', label)
}
</script>

<template>
    <div class="map-sidebar-tabs" :class="{ 'is-collapsed': props.collapsed }">
        <Button
            v-for="item in props.items"
            :key="item.label"
            :icon="item.icon"
            :label="props.collapsed ? undefined : item.label"
            :active="props.modelValue === item.label"
            appearance="secondary"
            @click="handleSelect(item.label)"
        />
    </div>
</template>

<style scoped src="~/assets/css/components/templates/MapSidebarTabs.css"></style>
