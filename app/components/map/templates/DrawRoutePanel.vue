<script setup lang="ts">
import type { SectionAttrSchema } from '#shared/schemas/route.schema'

defineProps<{
    sectionAttrs: SectionAttrSchema[]
}>()

defineEmits<{
    reset: []
    save: []
    updateSectionAttr: [payload: { index: number; field: 'name' | 'comment' | 'description'; value: string }]
}>()
</script>

<template>
    <div class="draw-route-panel">
        <div class="draw-route-panel__label">경로 그리기</div>

        <div class="draw-route-panel__actions">
            <SidebarActionButton icon="i-lucide-rotate-ccw" @click="$emit('reset')">
                초기화
            </SidebarActionButton>
            <SidebarActionButton icon="i-lucide-save" @click="$emit('save')">
                저장
            </SidebarActionButton>
        </div>

        <div class="draw-route-panel__section-label">구간 목록</div>

        <div class="draw-route-panel__section-list">
            <article
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-attr-${index}`"
                class="draw-route-panel__section-card"
            >
                <div class="draw-route-panel__section-meta">
                    <strong>{{ sectionAttr.name || `구간${index}` }}</strong>
                    <span>{{ index + 1 }}번째 구간</span>
                </div>

                <div class="draw-route-panel__field">
                    <input
                        :value="sectionAttr.name || ''"
                        type="text"
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

                <div class="draw-route-panel__field">
                    <input
                        :value="sectionAttr.comment || ''"
                        type="text"
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

                <div class="draw-route-panel__field">
                    <input
                        :value="sectionAttr.description || ''"
                        type="text"
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
