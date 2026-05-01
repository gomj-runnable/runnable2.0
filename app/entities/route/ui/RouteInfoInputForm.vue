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
    <UCard class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] min-w-[260px]">
        <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
                <span class="text-sm font-semibold text-text-base">경로정보 남기기</span>
                <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="emit('cancel')"
                />
            </div>
            <div class="text-[0.6875rem] text-meta">
                {{ props.lng.toFixed(5) }}, {{ props.lat.toFixed(5) }}
            </div>
            <UInput v-model="name" placeholder="장소명" :maxlength="100" size="sm" />
            <UTextarea
                v-model="description"
                placeholder="이 구간에 대한 의견을 남겨주세요"
                :maxlength="500"
                :rows="3"
                size="sm"
            />
            <div class="flex gap-1.5 justify-end">
                <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    label="취소"
                    @click="emit('cancel')"
                />
                <UButton
                    color="primary"
                    size="sm"
                    label="등록"
                    :disabled="!name.trim() || !description.trim()"
                    @click="handleSubmit"
                />
            </div>
        </div>
    </UCard>
</template>
