<script setup lang="ts">
import Button from '~/shared/ui/buttons/Button.vue'
import Textfield from '~/shared/ui/inputs/Textfield.vue'
import PopupModal from '~/shared/ui/PopupModal.vue'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'

const props = defineProps<{
    /** 팝업 표시 여부 */
    open: boolean
    /** 현재 모달 모드 (로그인 또는 회원가입) */
    mode: 'login' | 'signup'
}>()

const emit = defineEmits<{
    /** 팝업 열림/닫힘 상태 변경 시 새 상태 값을 전달 */
    'update:open': [value: boolean]
    /** 모달 모드 전환 시 새 모드를 전달 */
    'update:mode': [value: 'login' | 'signup']
    /** 로그인 폼 제출 시 이메일·비밀번호를 전달 */
    login: [email: string, password: string]
    /** 회원가입 폼 제출 시 이름·이메일·비밀번호를 전달 */
    signup: [name: string, email: string, password: string]
    /** 인증 성공 시 발생 */
    success: []
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

/** 폼 입력값과 에러 메시지를 초기화한다 */
const resetForm = () => {
    name.value = ''
    email.value = ''
    password.value = ''
    errorMessage.value = ''
}

watch(
    () => props.open,
    (open) => {
        // 팝업이 열릴 때 폼 초기화
        if (open) resetForm()
    }
)

watch(
    () => props.mode,
    () => {
        // 모드 전환 시 폼 초기화
        resetForm()
    }
)

const authEffect = useAuthSideeffect()

/** 모드에 따라 로그인 또는 회원가입을 요청하고 결과를 처리한다 */
const handleSubmit = async () => {
    // 에러 초기화 후 로딩 시작
    errorMessage.value = ''
    isLoading.value = true
    try {
        // 모드에 따라 로그인 또는 회원가입 실행
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

/** 로그인↔회원가입 모드를 전환한다 */
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
                    <Textfield v-model="name" placeholder="사용자 이름" autocomplete="name" />
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
                    <UIcon name="i-lucide-alert-circle" />
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

<style scoped src="./AuthModal.css"></style>
