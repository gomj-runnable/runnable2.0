<script setup lang="ts">
import type {
    SavedRunRecord,
    RunInsightWeekly,
    ConditionLevel
} from '../../shared/types/run-record'

definePageMeta({ ssr: false })

const { data: records, refresh } = await useFetch<SavedRunRecord[]>('/api/run-records')
const { data: weeklyInsight } = await useFetch<RunInsightWeekly>('/api/run-records/insights/weekly')

const isCreateOpen = ref(false)
const isSubmitting = ref(false)

const conditionOptions: { label: string; value: ConditionLevel }[] = [
    { label: '좋음', value: 'good' },
    { label: '보통', value: 'normal' },
    { label: '나쁨', value: 'bad' }
]

const form = reactive({
    runDate: new Date().toISOString().split('T')[0],
    distanceKm: 0,
    durationSec: 0,
    avgPaceSecPerKm: 0,
    rpe: 5,
    condition: 'normal' as ConditionLevel,
    sleepHours: undefined as number | undefined,
    stressLevel: undefined as number | undefined,
    notes: ''
})

/** 거리와 시간으로 페이스 자동 계산 */
watch(
    () => [form.distanceKm, form.durationSec],
    () => {
        if (form.distanceKm > 0 && form.durationSec > 0) {
            form.avgPaceSecPerKm = Math.round(form.durationSec / form.distanceKm)
        }
    }
)

const durationMin = computed({
    get: () => Math.floor(form.durationSec / 60),
    set: (v: number) => {
        form.durationSec = v * 60 + (form.durationSec % 60)
    }
})

const durationSecRemainder = computed({
    get: () => form.durationSec % 60,
    set: (v: number) => {
        form.durationSec = Math.floor(form.durationSec / 60) * 60 + v
    }
})

function resetForm() {
    form.runDate = new Date().toISOString().split('T')[0]
    form.distanceKm = 0
    form.durationSec = 0
    form.avgPaceSecPerKm = 0
    form.rpe = 5
    form.condition = 'normal'
    form.sleepHours = undefined
    form.stressLevel = undefined
    form.notes = ''
}

async function createRecord() {
    isSubmitting.value = true
    try {
        await $fetch('/api/run-records', { method: 'POST', body: form })
        isCreateOpen.value = false
        resetForm()
        await refresh()
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '기록 실패'
        alert(msg)
    } finally {
        isSubmitting.value = false
    }
}

async function deleteRecord(recordId: string) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ($fetch as any)(`/api/run-records/${recordId}`, { method: 'DELETE' })
        await refresh()
    } catch {
        alert('삭제 실패')
    }
}

function formatPace(secPerKm: number): string {
    const m = Math.floor(secPerKm / 60)
    const s = secPerKm % 60
    return `${m}'${s.toString().padStart(2, '0')}"`
}

function formatDuration(sec: number): string {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}시간 ${m}분`
    return `${m}분 ${s}초`
}

const conditionEmoji = (c: ConditionLevel) => (c === 'good' ? '😊' : c === 'normal' ? '😐' : '😞')
</script>

<template>
    <div class="container mx-auto p-6 max-w-4xl">
        <header class="mb-6 flex items-center justify-between">
            <div>
                <NuxtLink to="/" class="text-sm text-(--ui-text-muted) hover:underline">
                    &larr; 홈
                </NuxtLink>
                <h1 class="text-2xl font-semibold mt-1">러닝 일지</h1>
                <p class="text-sm text-(--ui-text-muted) mt-1">
                    달리기 기록과 컨디션을 추적합니다.
                </p>
            </div>
            <div class="flex items-center gap-2">
                <UColorModeButton />
                <UButton icon="i-lucide-plus" @click="isCreateOpen = true">기록 추가</UButton>
            </div>
        </header>

        <!-- 주간 인사이트 -->
        <UCard v-if="weeklyInsight" class="mb-6">
            <template #header>
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5" />
                    <h2 class="font-medium">주간 요약</h2>
                    <span class="text-xs text-(--ui-text-muted) ml-auto">
                        {{ weeklyInsight.weekStart }} ~
                    </span>
                </div>
            </template>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                    <p class="text-2xl font-bold">{{ weeklyInsight.recordCount }}</p>
                    <p class="text-xs text-(--ui-text-muted)">기록 수</p>
                </div>
                <div>
                    <p class="text-2xl font-bold">
                        {{ weeklyInsight.totalDistanceKm.toFixed(1) }}km
                    </p>
                    <p class="text-xs text-(--ui-text-muted)">총 거리</p>
                </div>
                <div>
                    <p class="text-2xl font-bold">
                        {{ formatPace(weeklyInsight.avgPaceSecPerKm) }}
                    </p>
                    <p class="text-xs text-(--ui-text-muted)">평균 페이스</p>
                </div>
                <div>
                    <p class="text-2xl font-bold">
                        {{ weeklyInsight.avgRpe.toFixed(1) }}
                        <span
                            v-if="weeklyInsight.deltaRpeVsLastWeek !== null"
                            class="text-sm"
                            :class="
                                weeklyInsight.deltaRpeVsLastWeek > 0
                                    ? 'text-red-500'
                                    : 'text-green-500'
                            "
                        >
                            {{
                                weeklyInsight.deltaRpeVsLastWeek > 0
                                    ? `+${weeklyInsight.deltaRpeVsLastWeek.toFixed(1)}`
                                    : weeklyInsight.deltaRpeVsLastWeek.toFixed(1)
                            }}
                        </span>
                    </p>
                    <p class="text-xs text-(--ui-text-muted)">평균 RPE</p>
                </div>
            </div>
        </UCard>

        <!-- 기록 목록 -->
        <div v-if="!records?.length" class="text-center py-12 text-(--ui-text-muted)">
            <UIcon name="i-lucide-notebook-pen" class="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>아직 러닝 기록이 없습니다.</p>
            <UButton class="mt-4" variant="outline" @click="isCreateOpen = true">
                첫 기록 작성하기
            </UButton>
        </div>

        <div v-else class="space-y-3">
            <UCard v-for="rec in records" :key="rec.recordId">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium">{{ rec.runDate }}</span>
                            <span class="text-lg">{{ conditionEmoji(rec.condition) }}</span>
                            <UBadge variant="subtle" color="neutral" size="xs">
                                RPE {{ rec.rpe }}
                            </UBadge>
                        </div>
                        <div class="flex gap-4 text-sm text-(--ui-text-muted)">
                            <span>{{ rec.distanceKm.toFixed(2) }} km</span>
                            <span>{{ formatDuration(rec.durationSec) }}</span>
                            <span>{{ formatPace(rec.avgPaceSecPerKm) }}/km</span>
                        </div>
                        <p v-if="rec.notes" class="text-sm mt-1 text-(--ui-text-muted)">
                            {{ rec.notes }}
                        </p>
                    </div>
                    <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="xs"
                        @click="deleteRecord(rec.recordId)"
                    />
                </div>
            </UCard>
        </div>

        <!-- 기록 생성 모달 -->
        <UModal v-model:open="isCreateOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <h3 class="font-medium">러닝 기록 추가</h3>
                    </template>

                    <form class="space-y-4" @submit.prevent="createRecord">
                        <UInput v-model="form.runDate" type="date" label="날짜" required />

                        <div class="grid grid-cols-2 gap-3">
                            <UInput
                                v-model.number="form.distanceKm"
                                type="number"
                                step="0.01"
                                min="0"
                                label="거리 (km)"
                                required
                            />
                            <div>
                                <label class="text-xs text-(--ui-text-muted) mb-1 block"
                                    >소요 시간</label
                                >
                                <div class="flex gap-1 items-center">
                                    <UInput
                                        v-model.number="durationMin"
                                        type="number"
                                        min="0"
                                        placeholder="분"
                                        class="flex-1"
                                    />
                                    <span class="text-sm">:</span>
                                    <UInput
                                        v-model.number="durationSecRemainder"
                                        type="number"
                                        min="0"
                                        max="59"
                                        placeholder="초"
                                        class="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-(--ui-text-muted) mb-1 block"
                                    >RPE (1~10)</label
                                >
                                <input
                                    v-model.number="form.rpe"
                                    type="range"
                                    min="1"
                                    max="10"
                                    class="w-full"
                                />
                                <span class="text-sm text-center block">{{ form.rpe }}</span>
                            </div>
                            <div>
                                <label class="text-xs text-(--ui-text-muted) mb-1 block"
                                    >컨디션</label
                                >
                                <select
                                    v-model="form.condition"
                                    class="w-full rounded-md border border-(--ui-border) bg-(--ui-bg) px-3 py-2 text-sm"
                                >
                                    <option
                                        v-for="opt in conditionOptions"
                                        :key="opt.value"
                                        :value="opt.value"
                                    >
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <UInput
                                v-model.number="form.sleepHours"
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                label="수면 시간 (선택)"
                            />
                            <UInput
                                v-model.number="form.stressLevel"
                                type="number"
                                min="1"
                                max="5"
                                label="스트레스 1~5 (선택)"
                            />
                        </div>

                        <UTextarea v-model="form.notes" placeholder="메모 (선택)" />

                        <div class="flex justify-end gap-2 pt-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="isCreateOpen = false"
                            >
                                취소
                            </UButton>
                            <UButton type="submit" :loading="isSubmitting">저장</UButton>
                        </div>
                    </form>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
