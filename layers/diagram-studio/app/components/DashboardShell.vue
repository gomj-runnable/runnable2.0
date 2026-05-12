<script setup lang="ts">
import { ref, watch, useRoute } from '#imports'
import type { DiagramJSON } from '../../runtime/types'

defineProps<{
    meta?: DiagramJSON['meta'] | null
    activeTab?: string
}>()

defineEmits<{
    'update:activeTab': [tab: string]
    'open-help': []
}>()

const mobileSidebarOpen = ref(false)
const route = useRoute()

watch(
    () => route.fullPath,
    () => {
        mobileSidebarOpen.value = false
    }
)

function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
}

function closeMobileSidebar() {
    mobileSidebarOpen.value = false
}
</script>

<template>
    <UDashboardGroup
        storage="local"
        storage-key="diagram-studio"
        class="h-dvh relative"
        aria-label="다이어그램 스튜디오 워크스페이스"
    >
        <!-- Mobile backdrop -->
        <div
            v-if="mobileSidebarOpen"
            class="fixed inset-0 bg-black/50 z-49 md:hidden"
            aria-hidden="true"
            @click="closeMobileSidebar"
        />

        <!-- Left sidebar -->
        <UDashboardSidebar
            id="ds-sidebar"
            :resizable="false"
            :class="[
                'flex-shrink-0',
                mobileSidebarOpen
                    ? 'max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:h-dvh max-md:z-50 max-md:translate-x-0'
                    : 'max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:h-dvh max-md:z-50 max-md:-translate-x-full'
            ]"
            :ui="{
                root: 'w-[280px] min-w-[280px] max-w-[280px] flex-shrink-0',
                header: 'px-4 h-12 flex items-center',
                body: 'p-0 overflow-y-auto'
            }"
        >
            <template #header>
                <!-- Brand -->
                <div class="flex items-center gap-2 w-full" aria-label="Diagram Studio 브랜드">
                    <span
                        class="font-mono text-[0.8125rem] font-semibold text-primary tracking-tight whitespace-nowrap"
                        aria-hidden="true"
                    >
                        <span class="text-muted">[</span>DS<span class="text-muted">]</span>
                    </span>
                    <span class="font-mono text-[0.8125rem] font-semibold tracking-widest uppercase"
                        >Diagram Studio</span
                    >
                    <UBadge
                        label="v1"
                        color="neutral"
                        variant="outline"
                        size="xs"
                        class="font-mono tracking-[0.05em]"
                        aria-label="버전"
                    />
                    <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="ml-auto md:hidden"
                        aria-label="사이드바 닫기"
                        @click="closeMobileSidebar"
                    />
                </div>
            </template>

            <!-- Sidebar content slot -->
            <slot name="sidebar" />
        </UDashboardSidebar>

        <!-- Main panel: navbar + canvas + detail -->
        <UDashboardPanel id="ds-main" class="flex flex-col flex-1 overflow-hidden min-w-0">
            <template #header>
                <UDashboardNavbar :toggle="false" :ui="{ root: 'h-12 px-4 gap-2' }">
                    <template #leading>
                        <UButton
                            icon="i-lucide-menu"
                            color="neutral"
                            variant="ghost"
                            size="sm"
                            class="md:hidden flex-shrink-0"
                            aria-label="사이드바 토글"
                            :aria-expanded="mobileSidebarOpen"
                            @click="toggleMobileSidebar"
                        />
                    </template>

                    <template #left>
                        <slot name="tabs" />
                    </template>

                    <template #right>
                        <!-- Meta information -->
                        <div
                            class="flex items-center gap-1.5 pl-4 border-l border-default h-full flex-shrink-0 max-sm:pl-2 max-sm:gap-1"
                            aria-label="다이어그램 메타 정보"
                            role="status"
                        >
                            <template v-if="meta">
                                <UTooltip
                                    :text="new Date(meta.generatedAt).toISOString()"
                                    :delay-duration="200"
                                >
                                    <span
                                        class="flex items-baseline gap-1 whitespace-nowrap max-md:hidden"
                                    >
                                        <span
                                            class="font-mono text-[0.5625rem] font-semibold text-dimmed uppercase tracking-[0.08em]"
                                            >gen</span
                                        >
                                        <span class="font-mono text-[0.6875rem] text-muted">{{
                                            new Date(meta.generatedAt).toLocaleString('ko-KR', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        }}</span>
                                    </span>
                                </UTooltip>
                                <span
                                    class="font-mono text-[0.625rem] text-dimmed max-md:hidden"
                                    aria-hidden="true"
                                    >/</span
                                >
                                <span class="flex items-baseline gap-1 whitespace-nowrap">
                                    <span
                                        class="font-mono text-[0.5625rem] font-semibold text-dimmed uppercase tracking-[0.08em]"
                                        >sha</span
                                    >
                                    <UBadge
                                        :label="meta.sourceCommit.slice(0, 7)"
                                        color="primary"
                                        variant="soft"
                                        size="xs"
                                        class="font-mono"
                                    />
                                </span>
                                <span
                                    class="font-mono text-[0.625rem] text-dimmed"
                                    aria-hidden="true"
                                    >/</span
                                >
                                <span class="flex items-baseline gap-1 whitespace-nowrap">
                                    <span
                                        class="font-mono text-[0.5625rem] font-semibold text-dimmed uppercase tracking-[0.08em]"
                                        >N</span
                                    >
                                    <span class="font-mono text-[0.6875rem] text-muted">{{
                                        meta.nodeCount
                                    }}</span>
                                </span>
                                <span
                                    class="font-mono text-[0.625rem] text-dimmed"
                                    aria-hidden="true"
                                    >+</span
                                >
                                <span class="flex items-baseline gap-1 whitespace-nowrap">
                                    <span
                                        class="font-mono text-[0.5625rem] font-semibold text-dimmed uppercase tracking-[0.08em]"
                                        >E</span
                                    >
                                    <span class="font-mono text-[0.6875rem] text-muted">{{
                                        meta.edgeCount
                                    }}</span>
                                </span>
                            </template>
                            <template v-else>
                                <span class="font-mono text-[0.6875rem] text-dimmed italic"
                                    >no data</span
                                >
                            </template>
                            <UButton
                                icon="i-lucide-help-circle"
                                color="neutral"
                                variant="ghost"
                                size="xs"
                                class="ml-1 flex-shrink-0"
                                aria-label="단축키 도움말 (?)"
                                @click="$emit('open-help')"
                            />
                        </div>
                    </template>
                </UDashboardNavbar>
            </template>

            <!-- Canvas + detail overlay -->
            <div class="flex flex-1 overflow-hidden relative">
                <main
                    class="flex-1 overflow-hidden relative min-w-0"
                    aria-label="다이어그램 캔버스 영역"
                >
                    <slot name="canvas" />
                </main>
                <aside class="flex-shrink-0" aria-label="노드 상세 패널">
                    <slot name="detail" />
                </aside>
            </div>
        </UDashboardPanel>
    </UDashboardGroup>
</template>
