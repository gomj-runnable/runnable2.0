<script setup lang="ts">
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
    <UModal
        :open="open"
        :title="mode === 'login' ? '로그인' : '회원가입'"
        :description="mode === 'login' ? '계정에 로그인하세요' : '새 계정을 만드세요'"
        :ui="{ footer: 'justify-end' }"
        @update:open="$emit('update:open', $event)"
    >
        <template #body>
            <div class="fields-root flex flex-col gap-3">
                <label v-if="mode === 'signup'" class="map-form-field">
                    <span class="map-form-label">이름</span>
                    <UInput v-model="name" placeholder="사용자 이름" autocomplete="name" />
                </label>

                <label class="map-form-field">
                    <span class="map-form-label">이메일</span>
                    <UInput
                        v-model="email"
                        type="email"
                        placeholder="email@example.com"
                        autocomplete="email"
                    />
                </label>

                <label class="map-form-field">
                    <span class="map-form-label">비밀번호</span>
                    <UInput
                        v-model="password"
                        type="password"
                        placeholder="비밀번호"
                        autocomplete="current-password"
                    />
                </label>

                <div
                    v-if="errorMessage"
                    class="flex items-start gap-[0.375rem] text-xs text-(--ui-error) px-3 py-[0.625rem] rounded-2xl bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] border border-[color-mix(in_srgb,var(--ui-error)_22%,transparent)]"
                >
                    <UIcon name="i-lucide-alert-circle" />
                    {{ errorMessage }}
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <button
                type="button"
                class="bg-transparent border-none text-(--ui-text-muted) text-xs cursor-pointer transition-colors duration-150 hover:text-(--ui-text-highlighted)"
                @click="toggleMode"
            >
                {{
                    mode === 'login'
                        ? '계정이 없으신가요? 회원가입'
                        : '이미 계정이 있으신가요? 로그인'
                }}
            </button>
            <div class="flex justify-end gap-[0.625rem] mt-4">
                <UButton variant="outline" color="neutral" label="취소" @click="close" />
                <UButton
                    variant="solid"
                    color="primary"
                    :label="mode === 'login' ? '로그인' : '가입'"
                    :disabled="isLoading"
                    @click="handleSubmit"
                />
            </div>
        </template>
    </UModal>
</template>

<style scoped>
.fields-root {
    --map-form-label-color: var(--ui-text-muted);
    --map-form-bg: var(--ui-bg-elevated);
    --map-form-color: var(--ui-text-highlighted);
    --map-form-font-size: 0.875rem;
    --map-form-line-height: 1.5;
    --map-form-padding: 0.75rem;
    --map-form-placeholder: var(--ui-text-dimmed);
    --map-form-focus-border: var(--ui-border-accented);
    --map-form-focus-bg: var(--ui-bg-elevated);
}
</style>
