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
        <div class="fab-popover">
            <UPopover
                v-model:open="isOpen"
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
                    <div class="fab-popover__panel">
                        <div
                            v-for="(group, gi) in visibleGroups"
                            :key="group.key"
                            class="fab-popover__group"
                        >
                            <div class="fab-popover__group-label">
                                <UIcon :name="group.icon" class="size-4 opacity-60" />
                                <span>{{ group.label }}</span>
                            </div>
                            <div class="fab-popover__items">
                                <button
                                    v-for="item in group.items"
                                    :key="item.key"
                                    class="fab-popover__item"
                                    :class="{ 'fab-popover__item--active': item.active }"
                                    @click="item.onClick()"
                                >
                                    <span
                                        v-if="item.dotColor"
                                        class="fab-popover__dot"
                                        :style="{ backgroundColor: item.dotColor }"
                                    />
                                    <UIcon :name="item.icon" class="size-4" />
                                    <span>{{ item.label }}</span>
                                </button>
                            </div>
                            <USeparator v-if="gi < visibleGroups.length - 1" />
                        </div>
                    </div>
                </template>
            </UPopover>
        </div>
    </Teleport>
</template>

<style scoped>
.fab-popover {
    position: fixed;
    bottom: 2.5rem;
    right: 1.5rem;
    z-index: 50;
    display: none;
}

@media (max-width: 1023px) {
    .fab-popover {
        display: block;
    }
}

.fab-popover__panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    max-height: 70vh;
    overflow-y: auto;
    min-width: 12rem;
}

.fab-popover__group-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--ui-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.fab-popover__items {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.fab-popover__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4375rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: var(--ui-text-default);
    cursor: pointer;
    transition: background 0.15s;
}

.fab-popover__item:hover {
    background: var(--ui-bg-elevated);
}

.fab-popover__item--active {
    color: var(--ui-primary);
    background: color-mix(in srgb, var(--ui-primary) 10%, transparent);
}

.fab-popover__item--active:hover {
    background: color-mix(in srgb, var(--ui-primary) 15%, transparent);
}

.fab-popover__dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    flex-shrink: 0;
}
</style>
