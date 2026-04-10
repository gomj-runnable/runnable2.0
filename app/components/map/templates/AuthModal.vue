<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'
import PopupModal from '~/components/map/templates/PopupModal.vue'
import { useAuthSideeffect } from '~/composables/sideeffect/useAuthSideeffect'

const props = defineProps<{
    open: boolean
    mode: 'login' | 'signup'
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'update:mode': [value: 'login' | 'signup']
    login: [email: string, password: string]
    signup: [name: string, email: string, password: string]
    success: []
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const resetForm = () => {
    name.value = ''
    email.value = ''
    password.value = ''
    errorMessage.value = ''
}

watch(() => props.open, (open) => {
    if (open) resetForm()
})

watch(() => props.mode, () => {
    resetForm()
})

const authEffect = useAuthSideeffect()

const handleSubmit = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
        if (props.mode === 'login') {
            await authEffect.login(email.value, password.value)
        } else {
            await authEffect.signup(name.value, email.value, password.value)
        }
        emit('success')
    } catch (e) {
        errorMessage.value = e instanceof Error ? e.message : '오류가 발생했습니다.'
    } finally {
        isLoading.value = false
    }
}

const toggleMode = () => {
    emit('update:mode', props.mode === 'login' ? 'signup' : 'login')
}
</script>

<template>
    <PopupModal
        :open="open"
        popup-id="popup-auth"
        aria-labelledby="popup-title-auth"
        @update:open="$emit('update:open', $event)"
    >
        <div class="auth-modal">
            <div class="auth-modal__header">
                <div class="auth-modal__eyebrow">
                    {{ mode === 'login' ? '로그인' : '회원가입' }}
                </div>
                <h2 id="popup-title-auth" class="auth-modal__title">
                    {{ mode === 'login' ? '계정에 로그인하세요' : '새 계정을 만드세요' }}
                </h2>
            </div>

            <form class="auth-modal__fields" @submit.prevent="handleSubmit">
                <label v-if="mode === 'signup'" class="auth-modal__field map-form-field">
                    <span class="map-form-label">이름</span>
                    <Textfield
                        v-model="name"
                        placeholder="사용자 이름"
                        autocomplete="name"
                    />
                </label>

                <label class="auth-modal__field map-form-field">
                    <span class="map-form-label">이메일</span>
                    <Textfield
                        v-model="email"
                        type="email"
                        placeholder="email@example.com"
                        autocomplete="email"
                    />
                </label>

                <label class="auth-modal__field map-form-field">
                    <span class="map-form-label">비밀번호</span>
                    <Textfield
                        v-model="password"
                        type="password"
                        placeholder="비밀번호"
                        autocomplete="current-password"
                    />
                </label>

                <div v-if="errorMessage" class="auth-modal__error">
                    {{ errorMessage }}
                </div>

                <div class="auth-modal__actions">
                    <Button
                        appearance="secondary"
                        role="cancel"
                        class="auth-modal__button"
                        label="취소"
                        @click="$emit('update:open', false)"
                    />
                    <Button
                        appearance="prominent"
                        class="auth-modal__button auth-modal__button--primary"
                        :label="mode === 'login' ? '로그인' : '가입'"
                        :disabled="isLoading"
                        @click="handleSubmit"
                    />
                </div>
            </form>

            <div class="auth-modal__footer">
                <button type="button" class="auth-modal__toggle" @click="toggleMode">
                    {{
                        mode === 'login'
                            ? '계정이 없으신가요? 회원가입'
                            : '이미 계정이 있으신가요? 로그인'
                    }}
                </button>
            </div>
        </div>
    </PopupModal>
</template>

<style scoped src="~/assets/css/components/templates/AuthModal.css"></style>
