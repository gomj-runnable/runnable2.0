<script setup lang="ts">
import Card from '~/assets/css/components/organization/cards/Card.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'

type TextfieldCardField = {
    id: string
    modelValue?: string
    label?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
    name?: string
    autocomplete?: string
    inputmode?: string
    leadingIcon?: string
    trailingIcon?: string
    supportingText?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    invalid?: boolean
    autofocus?: boolean
    multiline?: boolean
    rows?: number
    maxLength?: number
}

const props = withDefaults(
    defineProps<{
        title?: string
        eyebrow?: string
        meta?: string
        titleField?: TextfieldCardField
        fields?: TextfieldCardField[]
        selected?: boolean
        disabled?: boolean
    }>(),
    {
        title: undefined,
        eyebrow: undefined,
        meta: undefined,
        titleField: undefined,
        fields: () => [],
        selected: false,
        disabled: false
    }
)

defineEmits<{
    click: [event: MouseEvent]
    'update:field': [payload: { id: string; value: string; index: number }]
}>()
</script>

<template>
    <Card
        class="textfield-card"
        :title="title"
        :eyebrow="eyebrow"
        :meta="meta"
        :selected="selected"
        :disabled="disabled"
        as="article"
        @click="$emit('click', $event)"
    >
        <template v-if="titleField" #title>
            <div class="textfield-card__title-field">
                <Textfield
                    :model-value="titleField.modelValue ?? ''"
                    :label="titleField.label"
                    :placeholder="titleField.placeholder"
                    :type="titleField.type ?? 'text'"
                    :name="titleField.name"
                    :autocomplete="titleField.autocomplete"
                    :inputmode="titleField.inputmode"
                    :leading-icon="titleField.leadingIcon"
                    :trailing-icon="titleField.trailingIcon"
                    :supporting-text="titleField.supportingText"
                    :disabled="disabled || titleField.disabled"
                    :readonly="titleField.readonly"
                    :required="titleField.required"
                    :invalid="titleField.invalid"
                    :autofocus="titleField.autofocus"
                    @update:model-value="
                        $emit('update:field', {
                            id: titleField.id,
                            value: $event,
                            index: -1
                        })
                    "
                />
            </div>
        </template>

        <div class="textfield-card__fields">
            <slot>
                <div
                    v-for="(field, index) in fields"
                    :key="field.id"
                    class="textfield-card__field"
                    :class="[
                        `textfield-card__field--${field.id}`,
                        { 'is-multiline': field.multiline }
                    ]"
                >
                    <template v-if="field.multiline">
                        <label
                            class="textfield-card__textarea-wrap"
                            :class="{ 'is-disabled': disabled || field.disabled }"
                        >
                            <textarea
                                :value="field.modelValue ?? ''"
                                :name="field.name"
                                :placeholder="field.placeholder"
                                :rows="field.rows ?? 3"
                                :disabled="disabled || field.disabled"
                                :readonly="field.readonly"
                                :required="field.required"
                                :maxlength="field.maxLength"
                                class="textfield-card__textarea"
                                @input="
                                    $emit('update:field', {
                                        id: field.id,
                                        value: ($event.target as HTMLTextAreaElement).value,
                                        index
                                    })
                                "
                            />
                        </label>
                    </template>

                    <Textfield
                        v-else
                        :model-value="field.modelValue ?? ''"
                        :label="field.label"
                        :placeholder="field.placeholder"
                        :type="field.type ?? 'text'"
                        :name="field.name"
                        :autocomplete="field.autocomplete"
                        :inputmode="field.inputmode"
                        :leading-icon="field.leadingIcon"
                        :trailing-icon="field.trailingIcon"
                        :supporting-text="field.supportingText"
                        :disabled="disabled || field.disabled"
                        :readonly="field.readonly"
                        :required="field.required"
                        :invalid="field.invalid"
                        :autofocus="field.autofocus"
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

        <template v-if="$slots.footer" #footer>
            <slot name="footer" />
        </template>
    </Card>
</template>

<style scoped src="~/assets/css/components/organization/cards/TextfieldCard.css"></style>
