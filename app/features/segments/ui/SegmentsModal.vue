<script setup lang="ts">
import type { SavedSegment, SegmentLeaderboard } from '#shared/types/segment'

const props = defineProps<{
    open: boolean
    segments: SavedSegment[]
    isLoadingList: boolean
    selectedSegmentId: string | null
    leaderboard: SegmentLeaderboard | null
    isLoadingLeaderboard: boolean
    isLoggedIn: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'select-segment': [segmentId: string]
    'record-effort': [segmentId: string, input: { durationSec: number; paceSecPerKm: number }]
}>()

const showEffortForm = ref(false)
const durationMin = ref(0)
const durationSec = ref(0)

const segmentDistance = computed(() => {
    if (!props.selectedSegmentId) return 0
    return props.segments.find((s) => s.segmentId === props.selectedSegmentId)?.distanceKm ?? 0
})

const submitEffort = () => {
    if (!props.selectedSegmentId) return
    const total = durationMin.value * 60 + durationSec.value
    if (total <= 0 || segmentDistance.value <= 0) return
    const paceSecPerKm = Math.round(total / segmentDistance.value)
    emit('record-effort', props.selectedSegmentId, {
        durationSec: total,
        paceSecPerKm
    })
    showEffortForm.value = false
    durationMin.value = 0
    durationSec.value = 0
}

const formatPace = (secPerKm: number) => {
    const m = Math.floor(secPerKm / 60)
    const s = Math.floor(secPerKm % 60)
        .toString()
        .padStart(2, '0')
    return `${m}'${s}"/km`
}

const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
        .toString()
        .padStart(2, '0')
    return `${m}:${s}`
}
</script>

<template>
    <UModal
        :open="open"
        title="세그먼트"
        :ui="{ content: 'max-w-xl' }"
        @update:open="$emit('update:open', $event)"
    >
        <template #body>
            <div class="flex flex-col gap-3">
                <div v-if="isLoadingList" class="py-4 text-center text-sm text-(--ui-text-muted)">
                    로딩 중...
                </div>
                <div
                    v-else-if="segments.length === 0"
                    class="py-4 text-center text-sm text-(--ui-text-muted)"
                >
                    이 경로에 등록된 세그먼트가 없습니다
                </div>
                <ul v-else class="flex flex-col gap-2 list-none m-0 p-0">
                    <li v-for="seg in segments" :key="seg.segmentId">
                        <button
                            class="w-full text-left rounded-md border px-3 py-2 transition-colors"
                            :class="
                                selectedSegmentId === seg.segmentId
                                    ? 'border-(--ui-primary) bg-(--ui-primary)/10'
                                    : 'border-(--ui-border) hover:bg-(--ui-bg-elevated)'
                            "
                            @click="emit('select-segment', seg.segmentId)"
                        >
                            <div class="flex justify-between gap-2">
                                <span class="font-medium truncate">{{ seg.name }}</span>
                                <span class="text-sm text-(--ui-text-muted) shrink-0">
                                    {{ seg.distanceKm.toFixed(2) }} km
                                </span>
                            </div>
                            <div
                                v-if="seg.description"
                                class="text-xs text-(--ui-text-dimmed) mt-0.5 line-clamp-1"
                            >
                                {{ seg.description }}
                            </div>
                            <div class="text-xs text-(--ui-text-dimmed) mt-0.5">
                                기록 {{ seg.effortCount }}개
                            </div>
                        </button>
                    </li>
                </ul>

                <div
                    v-if="selectedSegmentId"
                    class="rounded-lg border border-(--ui-border) p-3 flex flex-col gap-2"
                >
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-semibold">리더보드</div>
                        <UButton
                            v-if="isLoggedIn"
                            size="xs"
                            color="primary"
                            variant="outline"
                            :icon="showEffortForm ? 'i-lucide-x' : 'i-lucide-timer'"
                            :label="showEffortForm ? '취소' : '내 기록 등록'"
                            @click="showEffortForm = !showEffortForm"
                        />
                    </div>

                    <form
                        v-if="showEffortForm"
                        class="flex items-end gap-2 text-sm"
                        @submit.prevent="submitEffort"
                    >
                        <label class="flex flex-col">
                            <span class="text-xs text-(--ui-text-dimmed)">분</span>
                            <UInput v-model.number="durationMin" type="number" min="0" size="sm" />
                        </label>
                        <label class="flex flex-col">
                            <span class="text-xs text-(--ui-text-dimmed)">초</span>
                            <UInput
                                v-model.number="durationSec"
                                type="number"
                                min="0"
                                max="59"
                                size="sm"
                            />
                        </label>
                        <UButton type="submit" size="sm" color="primary" label="등록" />
                    </form>

                    <div
                        v-if="isLoadingLeaderboard"
                        class="py-3 text-center text-sm text-(--ui-text-muted)"
                    >
                        리더보드 로딩 중...
                    </div>
                    <div
                        v-else-if="!leaderboard || leaderboard.top.length === 0"
                        class="py-3 text-center text-sm text-(--ui-text-muted)"
                    >
                        아직 기록이 없습니다
                    </div>
                    <ol v-else class="flex flex-col gap-1 list-none m-0 p-0">
                        <li
                            v-for="(effort, idx) in leaderboard.top"
                            :key="effort.effortId"
                            class="flex justify-between items-center text-sm rounded px-2 py-1.5 odd:bg-(--ui-bg-elevated)/40"
                        >
                            <div class="flex items-center gap-2 min-w-0">
                                <span
                                    class="shrink-0 w-6 text-center font-semibold text-(--ui-primary)"
                                >
                                    {{ idx + 1 }}
                                </span>
                                <span class="truncate">
                                    {{ effort.userName ?? '익명' }}
                                </span>
                            </div>
                            <div class="shrink-0 flex gap-3 text-(--ui-text-muted)">
                                <span>{{ formatDuration(effort.durationSec) }}</span>
                                <span>{{ formatPace(effort.paceSecPerKm) }}</span>
                            </div>
                        </li>
                    </ol>

                    <div
                        v-if="leaderboard?.userBest"
                        class="text-xs text-(--ui-text-muted) border-t border-(--ui-border) pt-2"
                    >
                        내 최고 기록: {{ formatDuration(leaderboard.userBest.durationSec) }} ({{
                            formatPace(leaderboard.userBest.paceSecPerKm)
                        }})
                        <span v-if="leaderboard.userRank">— {{ leaderboard.userRank }}위</span>
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end">
                <UButton color="neutral" label="닫기" @click="$emit('update:open', false)" />
            </div>
        </template>
    </UModal>
</template>
