<script setup lang="ts">
/**
 * 열고 닫는 표면 슬롯 호스트. 활성 플러그인의 slot 에 따라 chrome 을 제공한다.
 *  - sidepanel → USlideover (우측)
 *  - dashboard → UModal (넓게)
 *  - popup     → UModal (scrollable)
 * 플러그인 컴포넌트는 콘텐츠만 그리면 된다.
 */
import { usePluginSurfaces } from './usePluginSurfaces'

const { active, close } = usePluginSurfaces()

function onUpdateOpen(value: boolean) {
    if (!value) close()
}
</script>

<template>
    <USlideover
        v-if="active?.slot === 'sidepanel'"
        :open="true"
        :title="active?.label"
        :description="active?.description"
        side="right"
        @update:open="onUpdateOpen"
    >
        <template #body>
            <component :is="active?.component" />
        </template>
    </USlideover>

    <UModal
        v-else-if="active?.slot === 'dashboard'"
        :open="true"
        :title="active?.label"
        :description="active?.description"
        :ui="{ content: 'max-w-4xl' }"
        @update:open="onUpdateOpen"
    >
        <template #body>
            <component :is="active?.component" />
        </template>
    </UModal>

    <UModal
        v-else-if="active?.slot === 'popup'"
        :open="true"
        :title="active?.label"
        :description="active?.description"
        :ui="{ body: 'max-h-[70vh] overflow-y-auto' }"
        @update:open="onUpdateOpen"
    >
        <template #body>
            <component :is="active?.component" />
        </template>
    </UModal>
</template>
