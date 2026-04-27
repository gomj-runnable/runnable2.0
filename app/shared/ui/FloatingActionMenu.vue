<script setup lang="ts">
/**
 * FloatingActionMenu — 모바일 전용 FAB (Floating Action Button) 메뉴
 *
 * 지도 위의 칩 버튼들을 모바일에서 하나의 플로팅 버튼으로 통합한다.
 * - FAB 클릭 → 세로 그룹 버튼 표시
 * - 그룹 클릭 → 가로 서브 아이템 확장
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
const expandedGroupKey = ref<string | null>(null)

const toggleMenu = () => {
    if (isOpen.value) {
        isOpen.value = false
        expandedGroupKey.value = null
    } else {
        isOpen.value = true
    }
}

const toggleGroup = (key: string) => {
    expandedGroupKey.value = expandedGroupKey.value === key ? null : key
}

const visibleGroups = computed(() =>
    props.groups.filter(
        (g) => g.visible !== false && g.items.some((i) => i.visible !== false)
    )
)

/** 배경 클릭 시 메뉴 닫기 */
const handleBackdropClick = () => {
    isOpen.value = false
    expandedGroupKey.value = null
}
</script>

<template>
    <Teleport to="body">
        <!-- 배경 오버레이 -->
        <Transition name="fab-backdrop">
            <div
                v-if="isOpen"
                class="fab-menu__backdrop"
                @click="handleBackdropClick"
            />
        </Transition>

        <div class="fab-menu">
            <!-- 그룹 목록 (세로 확장) -->
            <Transition name="fab-groups">
                <div v-if="isOpen" class="fab-menu__groups">
                    <div
                        v-for="group in visibleGroups"
                        :key="group.key"
                        class="fab-menu__group"
                    >
                        <!-- 서브 아이템 (가로 확장) -->
                        <Transition name="fab-sub">
                            <div
                                v-if="expandedGroupKey === group.key"
                                class="fab-menu__sub-items"
                            >
                                <template v-for="item in group.items" :key="item.key">
                                    <button
                                        v-if="item.visible !== false"
                                        class="fab-menu__sub-item"
                                        :class="{ 'is-active': item.active }"
                                        @click="item.onClick()"
                                    >
                                        <span
                                            v-if="item.dotColor"
                                            class="fab-menu__dot"
                                            :style="{ backgroundColor: item.dotColor }"
                                        />
                                        <span :class="item.icon" class="fab-menu__sub-icon" />
                                        <span class="fab-menu__sub-label">{{ item.label }}</span>
                                    </button>
                                </template>
                            </div>
                        </Transition>

                        <!-- 그룹 버튼 -->
                        <button
                            class="fab-menu__group-btn"
                            :class="{ 'is-expanded': expandedGroupKey === group.key }"
                            :aria-label="group.label"
                            @click="toggleGroup(group.key)"
                        >
                            <span :class="group.icon" class="fab-menu__group-icon" />
                        </button>
                    </div>
                </div>
            </Transition>

            <!-- FAB 트리거 -->
            <button
                class="fab-menu__trigger"
                :class="{ 'is-open': isOpen }"
                aria-label="메뉴 열기"
                @click="toggleMenu"
            >
                <span
                    :class="isOpen ? 'i-lucide-x' : 'i-lucide-ellipsis'"
                    class="fab-menu__trigger-icon"
                />
            </button>
        </div>
    </Teleport>
</template>

<style src="./FloatingActionMenu.css"></style>
