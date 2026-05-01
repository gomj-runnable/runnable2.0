<script setup lang="ts">
/**
 * FloatingActionMenu — 모바일 전용 FAB + UPopover 메뉴
 *
 * 지도 위의 칩 버튼들을 모바일에서 하나의 플로팅 버튼 + popover로 통합한다.
 */
export interface FloatingMenuItem {
    key: string
    label: string
    icon: string
    active?: boolean
    visible?: boolean
    dotColor?: string
    onClick: () => void
}

export interface FloatingMenuGroup {
    key: string
    label: string
    icon: string
    items: FloatingMenuItem[]
    visible?: boolean
}

const props = defineProps<{
    groups: FloatingMenuGroup[]
}>()

const isOpen = ref(false)

const visibleGroups = computed(() =>
    props.groups
        .filter((g) => g.visible !== false)
        .map((g) => ({
            ...g,
            items: g.items.filter((i) => i.visible !== false)
        }))
        .filter((g) => g.items.length > 0)
)
</script>

<template>
    <Teleport to="body">
        <div class="fixed bottom-10 right-6 z-[9] hidden max-lg:block">
            <UPopover
                v-model:open="isOpen"
                :dismissible="false"
                :modal="false"
                :content="{ side: 'top', align: 'end', sideOffset: 8 }"
            >
                <UButton
                    icon="i-lucide-ellipsis"
                    size="lg"
                    color="neutral"
                    variant="solid"
                    square
                    class="rounded-full shadow-lg"
                    aria-label="메뉴 열기"
                />

                <template #content>
                    <div class="flex flex-col gap-2 p-2 max-h-[70vh] overflow-y-auto min-w-48">
                        <div
                            v-for="(group, gi) in visibleGroups"
                            :key="group.key"
                        >
                            <div class="flex items-center gap-1.5 px-2 py-1 text-[0.6875rem] font-semibold text-(--ui-text-muted) uppercase tracking-[0.025em]">
                                <UIcon :name="group.icon" class="size-4 opacity-60" />
                                <span>{{ group.label }}</span>
                            </div>
                            <div class="flex flex-col gap-0.5">
                                <UButton
                                    v-for="item in group.items"
                                    :key="item.key"
                                    variant="ghost"
                                    color="neutral"
                                    class="flex items-center gap-2 px-2 py-[0.4375rem] rounded-md text-[0.8125rem] text-(--ui-text) justify-start hover:bg-(--ui-bg-elevated)"
                                    :class="item.active ? 'text-(--ui-primary) bg-(--ui-primary)/10 hover:bg-(--ui-primary)/15' : ''"
                                    @click="item.onClick()"
                                >
                                    <span
                                        v-if="item.dotColor"
                                        class="w-2 h-2 rounded-full shrink-0"
                                        :style="{ backgroundColor: item.dotColor }"
                                    />
                                    <UIcon :name="item.icon" class="size-4" />
                                    <span>{{ item.label }}</span>
                                </UButton>
                            </div>
                            <USeparator v-if="gi < visibleGroups.length - 1" />
                        </div>
                    </div>
                </template>
            </UPopover>
        </div>
    </Teleport>
</template>
