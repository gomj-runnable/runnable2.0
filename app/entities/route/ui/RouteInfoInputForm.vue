<script setup lang="ts">
/** 경로정보 입력 폼 — 지도 클릭으로 선택된 위치에 장소명과 설명을 작성한다 */
const props = defineProps<{
    lng: number
    lat: number
    elevation?: number
}>()

const emit = defineEmits<{
    submit: [payload: { name: string; description: string }]
    cancel: []
}>()

const name = ref('')
const description = ref('')

const handleSubmit = () => {
    if (!name.value.trim() || !description.value.trim()) return
    emit('submit', {
        name: name.value.trim(),
        description: description.value.trim()
    })
    name.value = ''
    description.value = ''
}
</script>

<template>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1.5 p-3 bg-surface-dark rounded-lg border border-border-accent min-w-[260px] shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
        <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-text-base">경로정보 남기기</span>
            <button class="bg-none border-none text-meta cursor-pointer p-0.5" @click="emit('cancel')">
                <UIcon name="i-lucide-x" />
            </button>
        </div>
        <div class="text-[0.6875rem] text-meta">
            {{ props.lng.toFixed(5) }}, {{ props.lat.toFixed(5) }}
        </div>
        <input
            v-model="name"
            class="w-full bg-[rgba(255,255,255,0.06)] border border-border-accent rounded-lg px-2 py-1.5 text-text-base text-[0.8125rem]"
            placeholder="장소명"
            maxlength="100"
        />
        <textarea
            v-model="description"
            class="w-full resize-y bg-[rgba(255,255,255,0.06)] border border-border-accent rounded-lg p-2 text-text-base text-[0.8125rem]"
            placeholder="이 구간에 대한 의견을 남겨주세요"
            maxlength="500"
            rows="3"
        />
        <div class="flex gap-1.5 justify-end">
            <button
                class="px-3 py-1.5 rounded-lg border-none text-[0.8125rem] cursor-pointer bg-[rgba(255,255,255,0.08)] text-meta"
                @click="emit('cancel')"
            >
                취소
            </button>
            <button
                class="px-3 py-1.5 rounded-lg border-none text-[0.8125rem] cursor-pointer bg-[#ffff00] text-black disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!name.trim() || !description.trim()"
                @click="handleSubmit"
            >
                등록
            </button>
        </div>
    </div>
</template>
