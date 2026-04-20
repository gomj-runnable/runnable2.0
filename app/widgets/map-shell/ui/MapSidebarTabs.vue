<script setup lang="ts">
import Button from '~/shared/ui/buttons/Button.vue'

type SidebarTabItem = {
    icon: string
    label: string
}

const props = withDefaults(
    defineProps<{
        /** 탭 목록 (아이콘·레이블 쌍) */
        items: readonly SidebarTabItem[]
        /** 현재 선택된 탭 레이블 */
        modelValue: string
        /** 사이드바 접힘 상태 여부 (접히면 레이블 숨김) */
        collapsed?: boolean
    }>(),
    {
        collapsed: false
    }
)

const emit = defineEmits<{
    /** 탭 선택 시 선택된 레이블 값을 전달 */
    'update:modelValue': [value: string]
}>()

/** 탭을 선택하고 부모에 선택 값을 emit 한다 */
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

<style scoped src="./MapSidebarTabs.css"></style>
