<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
    defineProps<{
        id?: string
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
    }>(),
    {
        id: undefined,
        label: undefined,
        placeholder: undefined,
        type: 'text',
        name: undefined,
        autocomplete: undefined,
        inputmode: undefined,
        leadingIcon: undefined,
        trailingIcon: undefined,
        supportingText: undefined,
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        autofocus: false
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

<style scoped src="~/assets/css/components/map/molecules/Textfield.css"></style>
