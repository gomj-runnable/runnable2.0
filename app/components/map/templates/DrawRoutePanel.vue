<script setup lang="ts">
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import TextfieldCard from '~/components/map/organizations/cards/TextfieldCard.vue'
import Button from '~/components/map/molecules/buttons/Button.vue'

defineProps<{
    sectionAttrs: SectionAttrSchema[]
}>()

defineEmits<{
    reset: []
    save: []
    updateSectionAttr: [
        payload: { index: number; field: 'name' | 'comment' | 'description'; value: string }
    ]
    removeSection: [payload: { index: number }]
}>()
</script>

<template>
    <div class="draw-route-panel">
        <div class="map-section-label">경로 그리기</div>

        <div class="draw-route-panel__actions">
            <Button
                icon="i-lucide-rotate-ccw"
                appearance="secondary"
                role="cancel"
                block
                @click="$emit('reset')"
            >
                초기화
            </Button>
            <Button icon="i-lucide-save" appearance="prominent" block @click="$emit('save')">
                저장
            </Button>
        </div>

        <div class="map-section-label">구간 목록</div>

        <div class="draw-route-panel__section-list">
            <TextfieldCard
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-attr-${index}`"
                :deletable="index > 0"
                :title-field="{
                    id: 'name',
                    modelValue: sectionAttr.name || '',
                    placeholder: `구간제목${index + 1}`
                }"
                :fields="[
                    {
                        id: 'comment',
                        modelValue: sectionAttr.comment || '',
                        placeholder: '구간 요약',
                        maxLength: 80
                    },
                    {
                        id: 'description',
                        modelValue: sectionAttr.description || '',
                        placeholder: '구간 설명',
                        multiline: true,
                        rows: 2
                    }
                ]"
                @update:field="
                    $emit('updateSectionAttr', {
                        index,
                        field: $event.id as 'name' | 'comment' | 'description',
                        value: $event.value
                    })
                "
                @delete="$emit('removeSection', { index })"
            >
                <template #meta>
                    {{ `포인트 ${index + 1}` }}
                </template>
            </TextfieldCard>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/DrawRoutePanel.css"></style>
