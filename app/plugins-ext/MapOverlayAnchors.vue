<script setup lang="ts">
/**
 * 지도 오버레이의 8방향 앵커 배치 호스트.
 *
 * 각 앵커는 position 만 책임지고, 그 안에서 기존 모서리 오버레이(named slot)와
 * chip 플러그인이 같은 flex 컨테이너의 자식으로 순차 배치된다.
 * 따라서 서로 절대 겹치지 않고 상대 위치로 쌓인다(이전엔 각자 absolute 로 같은 모서리를 점유해 겹쳤다).
 *
 * - 기존 모서리 오버레이: 같은 이름의 named slot 으로 주입 → props/emit 계약 그대로 유지
 * - chip 플러그인: manifest.position 기준 자동 분배(manifest.order 로 정렬), 데스크탑 전용
 */
import type { ChipAnchor } from './types'
import { pluginRegistry } from './registry'
import { usePluginPrefs } from './usePluginPrefs'
import { chipsForAnchor } from './chip-anchors'

const { load, isEnabled } = usePluginPrefs()

/** 앵커별 위치 + 스택 방향 클래스. 모바일에선 가장자리 여백을 좁힌다. */
const ANCHORS: { id: ChipAnchor; class: string }[] = [
    { id: 'top-left', class: 'top-4 left-4 max-md:top-1.5 max-md:left-1.5 flex-col items-start' },
    {
        id: 'top-center',
        class: 'top-4 left-1/2 -translate-x-1/2 max-md:top-1.5 flex-col items-center'
    },
    { id: 'top-right', class: 'top-4 right-4 max-md:top-1.5 max-md:right-1.5 flex-col items-end' },
    {
        id: 'middle-left',
        class: 'top-1/2 left-4 -translate-y-1/2 max-md:left-1.5 flex-col items-start'
    },
    {
        id: 'middle-right',
        class: 'top-1/2 right-4 -translate-y-1/2 max-md:right-1.5 flex-col items-end'
    },
    {
        id: 'bottom-left',
        class: 'bottom-4 left-4 max-md:bottom-1.5 max-md:left-1.5 flex-col items-start'
    },
    {
        id: 'bottom-center',
        class: 'bottom-4 left-1/2 -translate-x-1/2 max-md:bottom-1.5 flex-row items-center'
    },
    {
        id: 'bottom-right',
        class: 'bottom-4 right-4 max-md:bottom-1.5 max-md:right-1.5 flex-col items-end'
    }
]

const enabledChips = computed(() => pluginRegistry.filter((p) => p.slot === 'chip' && isEnabled(p)))

const chipsAt = (anchor: ChipAnchor) => chipsForAnchor(enabledChips.value, anchor)

const slots = useSlots()
/** 슬롯이 주입됐거나 배치될 chip 이 있는 앵커만 렌더한다. */
const hasContent = (anchor: ChipAnchor) => !!slots[anchor] || chipsAt(anchor).length > 0

onMounted(load)
</script>

<template>
    <template v-for="a in ANCHORS" :key="a.id">
        <div v-if="hasContent(a.id)" :class="['absolute z-20 flex gap-2 w-fit h-fit', a.class]">
            <slot :name="a.id" />
            <!-- chip 플러그인은 데스크탑 전용(모바일은 FAB 메뉴 사용) -->
            <component
                :is="p.component"
                v-for="p in chipsAt(a.id)"
                :key="p.id"
                class="max-md:hidden"
            />
        </div>
    </template>
</template>
