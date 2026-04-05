<script setup lang="ts">
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import Button from '~/components/map/molecules/buttons/Button.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'

defineProps<{
    sectionAttrs: SectionAttrSchema[]
}>()

defineEmits<{
    reset: []
    save: []
    updateSectionAttr: [
        payload: { index: number; field: 'name' | 'comment' | 'description'; value: string }
    ]
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
            <article
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-attr-${index}`"
                class="draw-route-panel__section-card map-surface-card"
            >
                <div class="map-form-field">
                    <Textfield
                        :model-value="sectionAttr.name || ''"
                        placeholder="구간명"
                        @update:model-value="
                            $emit('updateSectionAttr', {
                                index,
                                field: 'name',
                                value: $event
                            })
                        "
                    />
                </div>

                <div class="map-form-field">
                    <Textfield
                        :model-value="sectionAttr.comment || ''"
                        placeholder="구간 요약"
                        @update:model-value="
                            $emit('updateSectionAttr', {
                                index,
                                field: 'comment',
                                value: $event
                            })
                        "
                    />
                </div>

                <div class="map-form-field">
                    <Textfield
                        :model-value="sectionAttr.description || ''"
                        placeholder="구간 설명"
                        @update:model-value="
                            $emit('updateSectionAttr', {
                                index,
                                field: 'description',
                                value: $event
                            })
                        "
                    />
                </div>
            </article>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/map/templates/DrawRoutePanel.css"></style>
