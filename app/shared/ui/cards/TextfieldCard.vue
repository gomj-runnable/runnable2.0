<script setup lang="ts">
/** 카드 내 단일 입력 필드의 설정 타입 */
type TextfieldCardField = {
    /** 필드를 식별하는 고유 id */
    id: string
    /** 필드의 현재 입력 값 */
    modelValue?: string
    /** 필드 레이블 텍스트 */
    label?: string
    /** 필드 플레이스홀더 텍스트 */
    placeholder?: string
    /** input 타입 */
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
    /** 폼 전송 시 사용할 필드 이름 */
    name?: string
    /** 브라우저 자동완성 힌트 */
    autocomplete?: string
    /** 가상 키보드 타입 힌트 */
    inputmode?: 'none' | 'search' | 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal'
    /** 앞쪽 아이콘 이름 */
    leadingIcon?: string
    /** 뒤쪽 아이콘 이름 */
    trailingIcon?: string
    /** 하단 보조 안내 텍스트 */
    supportingText?: string
    /** 비활성화 여부 */
    disabled?: boolean
    /** 읽기 전용 여부 */
    readonly?: boolean
    /** 필수 입력 여부 */
    required?: boolean
    /** 유효성 오류 상태 여부 */
    invalid?: boolean
    /** 자동 포커스 여부 */
    autofocus?: boolean
    /** textarea 다중행 모드 여부 */
    multiline?: boolean
    /** multiline 모드일 때 textarea 행 수 */
    rows?: number
    /** 최대 입력 문자 수 */
    maxLength?: number
}

const props = withDefaults(
    defineProps<{
        /** 카드 헤더 타이틀 텍스트 */
        title?: string
        /** 타이틀 위에 표시할 소제목(eyebrow) 텍스트 */
        eyebrow?: string
        /** 카드 푸터에 표시할 메타 정보 텍스트 */
        meta?: string
        /** 타이틀 영역에 배치할 입력 필드 설정 */
        titleField?: TextfieldCardField
        /** 본문 영역에 순서대로 렌더링할 입력 필드 목록 */
        fields?: TextfieldCardField[]
        /** 선택 상태 여부 */
        selected?: boolean
        /** 카드 전체 비활성화 여부 */
        disabled?: boolean
        /** 삭제 버튼 표시 여부 */
        deletable?: boolean
    }>(),
    {
        title: undefined,
        eyebrow: undefined,
        meta: undefined,
        titleField: undefined,
        fields: () => [],
        selected: false,
        disabled: false,
        deletable: true
    }
)

/** 카드 클릭 / 필드 값 변경 / 카드 삭제 이벤트 */
defineEmits<{
    /** 카드 영역 클릭 이벤트 */
    click: [event: MouseEvent]
    /** 필드 값 변경 이벤트 (id, value, 필드 인덱스 포함) */
    'update:field': [payload: { id: string; value: string; index: number }]
    /** 삭제 버튼 클릭 이벤트 */
    delete: []
}>()
</script>

<template>
    <UCard
        variant="subtle"
        class="textfield-card"
        :class="{
            'ring-2 ring-[var(--ui-primary)]': selected,
            'opacity-50 pointer-events-none': disabled
        }"
        @click="$emit('click', $event)"
    >
        <template #header>
            <div v-if="titleField" class="textfield-card__title-row">
                <div class="textfield-card__title-field">
                    <UInput
                        :model-value="titleField.modelValue ?? ''"
                        :placeholder="titleField.placeholder"
                        :type="titleField.type ?? 'text'"
                        :name="titleField.name"
                        :autocomplete="titleField.autocomplete"
                        :inputmode="titleField.inputmode"
                        :icon="titleField.leadingIcon"
                        :trailing-icon="titleField.trailingIcon"
                        :disabled="disabled || titleField.disabled"
                        :readonly="titleField.readonly"
                        :required="titleField.required"
                        :color="titleField.invalid ? 'error' : undefined"
                        :autofocus="titleField.autofocus"
                        variant="none"
                        :ui="{ base: 'text-lg font-bold' }"
                        @update:model-value="
                            $emit('update:field', {
                                id: titleField.id,
                                value: $event,
                                index: -1
                            })
                        "
                    />
                </div>

                <UButton
                    v-if="deletable"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-trash-2"
                    size="sm"
                    square
                    aria-label="휴지통"
                    title="휴지통"
                    @click.stop="$emit('delete')"
                />
            </div>
            <div v-else-if="title || eyebrow">
                <p
                    v-if="eyebrow"
                    class="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-dimmed)]"
                >
                    {{ eyebrow }}
                </p>
                <p v-if="title" class="text-lg font-bold text-[var(--ui-text-highlighted)]">
                    {{ title }}
                </p>
            </div>
        </template>

        <div class="flex flex-col gap-1.5">
            <slot>
                <div v-for="(field, index) in fields" :key="field.id">
                    <template v-if="field.multiline">
                        <UTextarea
                            :model-value="field.modelValue ?? ''"
                            :placeholder="field.placeholder"
                            :rows="field.rows ?? 3"
                            :disabled="disabled || field.disabled"
                            :readonly="field.readonly"
                            :required="field.required"
                            :maxlength="field.maxLength"
                            variant="outline"
                            @update:model-value="
                                $emit('update:field', {
                                    id: field.id,
                                    value: $event,
                                    index
                                })
                            "
                        />
                    </template>

                    <UInput
                        v-else
                        :model-value="field.modelValue ?? ''"
                        :placeholder="field.placeholder"
                        :type="field.type ?? 'text'"
                        :name="field.name"
                        :autocomplete="field.autocomplete"
                        :inputmode="field.inputmode"
                        :icon="field.leadingIcon"
                        :trailing-icon="field.trailingIcon"
                        :disabled="disabled || field.disabled"
                        :readonly="field.readonly"
                        :required="field.required"
                        :color="field.invalid ? 'error' : undefined"
                        :autofocus="field.autofocus"
                        variant="outline"
                        @update:model-value="
                            $emit('update:field', {
                                id: field.id,
                                value: $event,
                                index
                            })
                        "
                    />
                </div>
            </slot>
        </div>

        <template #footer>
            <slot name="footer">
                <slot name="meta">
                    <p v-if="meta" class="text-xs font-medium text-[var(--ui-text-dimmed)]">
                        {{ meta }}
                    </p>
                </slot>
            </slot>
        </template>
    </UCard>
</template>
