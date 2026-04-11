<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
    defineProps<{
        /** input 요소의 고유 id */
        id?: string
        /** 필드 상단에 표시할 레이블 텍스트 */
        label?: string
        /** 입력 전 안내 문구 */
        placeholder?: string
        /** input 타입 (기본값: 'text') */
        type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
        /** 폼 전송 시 사용할 필드 이름 */
        name?: string
        /** 브라우저 자동완성 힌트 */
        autocomplete?: string
        /** 가상 키보드 타입 힌트 */
        inputmode?: 'none' | 'search' | 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal'
        /** 입력 필드 앞쪽에 표시할 아이콘 이름 */
        leadingIcon?: string
        /** 입력 필드 뒤쪽에 표시할 아이콘 이름 */
        trailingIcon?: string
        /** 필드 하단에 표시할 보조 안내 텍스트 */
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
    }>(),
    {
        type: 'text',
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        autofocus: false,
    }
)
</script>

<template>
    <label class="textfield" :class="{ 'is-disabled': disabled, 'is-invalid': invalid }">
        <span v-if="label || $slots.label" class="textfield__label">
            <slot name="label">{{ label }}</slot>
        </span>

        <div class="textfield__control">
            <slot name="leading">
                <UIcon
                    v-if="leadingIcon"
                    :name="leadingIcon"
                    class="textfield__icon textfield__icon--leading"
                />
            </slot>

            <input
                :id="id"
                v-model="model"
                :aria-invalid="invalid || undefined"
                :autocomplete="autocomplete"
                :autofocus="autofocus"
                :disabled="disabled"
                :inputmode="inputmode"
                :name="name"
                :placeholder="placeholder"
                :readonly="readonly"
                :required="required"
                :type="type"
                class="textfield__input"
            />

            <slot name="trailing">
                <UIcon
                    v-if="trailingIcon"
                    :name="trailingIcon"
                    class="textfield__icon textfield__icon--trailing"
                />
            </slot>
        </div>

        <span v-if="supportingText || $slots.supporting" class="textfield__supporting">
            <slot name="supporting">{{ supportingText }}</slot>
        </span>
    </label>
</template>

<style scoped src="~/assets/css/components/molecules/textfield/Textfield.css"></style>
