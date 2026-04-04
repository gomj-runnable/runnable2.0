<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * RouteDataTable — UTable 기반 경로 데이터 표
 *
 * Flat 사용:
 *   <RouteDataTable :data="rows" :columns="columns" />
 *
 * Compound 사용:
 *   <RouteDataTable :data="rows" :columns="columns">
 *     <template #caption>경로 목록</template>
 *     <template #actions>
 *       <RouteSearchInput v-model="filter" />
 *       <UButton icon="i-lucide-download" />
 *     </template>
 *   </RouteDataTable>
 *
 * Slots:
 *   caption  — 표 상단 타이틀 영역
 *   actions  — 우측 상단 필터/버튼 영역
 *   footer   — 표 하단 (페이지네이션 등)
 */
import type { TableColumn } from '@nuxt/ui'

defineProps<{
    data: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    caption?: string
}>()
</script>

<template>
    <div class="route-data-table">
        <!-- 헤더 -->
        <div v-if="$slots.caption || caption || $slots.actions" class="route-data-table__header">
            <div class="route-data-table__caption">
                <slot name="caption">
                    <span v-if="caption">{{ caption }}</span>
                </slot>
            </div>
            <div v-if="$slots.actions" class="route-data-table__actions">
                <slot name="actions" />
            </div>
        </div>

        <!-- 표 -->
        <UTable
            :data="data"
            :columns="columns"
            :loading="loading"
            :ui="{
                base: 'route-data-table__table',
                thead: 'route-data-table__thead',
                th: 'route-data-table__th',
                td: 'route-data-table__td'
            }"
        />

        <!-- 푸터 (페이지네이션 등) -->
        <div v-if="$slots.footer" class="route-data-table__footer">
            <slot name="footer" />
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/map/templates/RouteDataTable.css"></style>
