<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
    defineProps<{
        /** 카드 헤더 타이틀 텍스트 */
        title?: string
        /** 타이틀 위에 표시할 소제목(eyebrow) 텍스트 */
        eyebrow?: string
        /** 카드 본문에 표시할 설명 텍스트 */
        description?: string
        /** 카드 푸터에 표시할 메타 정보 텍스트 */
        meta?: string
        /** 클릭 가능한 인터랙티브 카드 여부 (button 태그로 렌더링) */
        interactive?: boolean
        /** 선택 상태 여부 */
        selected?: boolean
        /** 비활성화 여부 */
        disabled?: boolean
        /** 링크 URL 지정 시 a 태그로 렌더링 */
        href?: string
        /** 기본 렌더링 태그 (interactive/href 미지정 시 사용) */
        as?: 'article' | 'section' | 'div'
    }>(),
    {
        title: undefined,
        eyebrow: undefined,
        description: undefined,
        meta: undefined,
        interactive: false,
        selected: false,
        disabled: false,
        href: undefined,
        as: 'article'
    }
)

/** 카드 클릭 이벤트 */
defineEmits<{
    click: [event: MouseEvent]
}>()

const slots = useSlots()

/** href·interactive·disabled 조합에 따라 실제 렌더링 태그를 결정한다 */
const tagName = computed(() => {
    // href가 있고 활성 상태면 링크로 렌더링
    if (props.href && !props.disabled) {
        return 'a'
    }

    // interactive이고 활성 상태면 버튼으로 렌더링
    if (props.interactive && !props.disabled) {
        return 'button'
    }

    return props.as
})

/** 카드 상태에 따른 CSS 클래스를 반환한다 */
const cardTypeClass = computed(() => {
    if (props.disabled) {
        return 'is-disabled'
    }

    if (props.selected) {
        return 'is-selected'
    }

    if (props.interactive || props.href) {
        return 'is-interactive'
    }

    return null
})

/** 헤더 영역 표시 여부 (eyebrow, title, 관련 슬롯 중 하나라도 있으면 표시) */
const hasHeader = computed(() => {
    return Boolean(props.eyebrow || props.title || slots.eyebrow || slots.title || slots.header)
})

/** 본문 영역 표시 여부 (description 또는 default 슬롯이 있으면 표시) */
const hasBody = computed(() => {
    return Boolean(props.description || slots.default)
})

/** 푸터 영역 표시 여부 (meta 또는 관련 슬롯이 있으면 표시) */
const hasFooter = computed(() => {
    return Boolean(props.meta || slots.meta || slots.footer)
})
</script>

<template>
    <component
        :is="tagName"
        class="organization-card"
        :class="cardTypeClass"
        :href="tagName === 'a' ? href : undefined"
        :disabled="tagName === 'button' ? disabled : undefined"
        :aria-disabled="tagName !== 'button' && disabled ? 'true' : undefined"
        @click="$emit('click', $event)"
    >
        <div class="organization-card__glow" aria-hidden="true" />

        <header v-if="hasHeader" class="organization-card__header">
            <slot name="header">
                <p v-if="eyebrow || slots.eyebrow" class="organization-card__eyebrow">
                    <slot name="eyebrow">{{ eyebrow }}</slot>
                </p>
                <h3 v-if="title || slots.title" class="organization-card__title">
                    <slot name="title">{{ title }}</slot>
                </h3>
            </slot>
        </header>

        <div v-if="hasBody" class="organization-card__body">
            <slot>
                <p v-if="description" class="organization-card__description">
                    {{ description }}
                </p>
            </slot>
        </div>

        <footer v-if="hasFooter" class="organization-card__footer">
            <slot name="footer">
                <p v-if="meta || slots.meta" class="organization-card__meta">
                    <slot name="meta">{{ meta }}</slot>
                </p>
            </slot>
        </footer>
    </component>
</template>

<style scoped src="~/assets/css/components/organizations/cards/Card.css"></style>
