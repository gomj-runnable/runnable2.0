<script setup lang="ts">
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import SidebarActionButton from '~/components/map/molecules/SidebarActionButton.vue'

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
            <SidebarActionButton icon="i-lucide-rotate-ccw" @click="$emit('reset')">
                초기화
            </SidebarActionButton>
            <SidebarActionButton icon="i-lucide-save" @click="$emit('save')">
                저장
            </SidebarActionButton>
        </div>

        <div class="map-section-label">구간 목록</div>

        <div class="draw-route-panel__section-list">
            <article
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-attr-${index}`"
                class="draw-route-panel__section-card map-surface-card"
            >
                <div class="map-form-field">
                    <input
                        :value="sectionAttr.name || ''"
                        type="text"
                        class="map-form-control"
                        placeholder="구간명"
                        @input="
                            $emit('updateSectionAttr', {
                                index,
                                field: 'name',
                                value: ($event.target as HTMLInputElement).value
                            })
                        "
                    />
                </div>

                <div class="map-form-field">
                    <input
                        :value="sectionAttr.comment || ''"
                        type="text"
                        class="map-form-control"
                        placeholder="구간 요약"
                        @input="
                            $emit('updateSectionAttr', {
                                index,
                                field: 'comment',
                                value: ($event.target as HTMLInputElement).value
                            })
                        "
                    />
                </div>

                <div class="map-form-field">
                    <input
                        :value="sectionAttr.description || ''"
                        type="text"
                        class="map-form-control"
                        placeholder="구간 설명"
                        @input="
                            $emit('updateSectionAttr', {
                                index,
                                field: 'description',
                                value: ($event.target as HTMLInputElement).value
                            })
                        "
                    />
                </div>
            </article>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/map/templates/DrawRoutePanel.css"></style>
