<script setup lang="ts">
/**
 * AuthSlideOverContent — SlideOver 내부 인증 폼/프로필 UI
 *
 * 로그인 상태이면 프로필+로그아웃, 미로그인이면 로그인/회원가입 폼을 표시한다.
 */
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'
import { hasAdminAccess } from '../../../../shared/constants/roles'

const emit = defineEmits<{
    success: []
    logout: []
}>()

const authStore = useAuthStore()
const authEffect = useAuthSideeffect()

const mode = ref<'login' | 'signup'>('login')
const form = reactive({
    name: '',
    email: '',
    password: '',
    error: '',
    isLoading: false,
    agreedToTerms: false,
    agreedToPrivacy: false
})

const reset = () => {
    form.name = ''
    form.email = ''
    form.password = ''
    form.error = ''
    form.agreedToTerms = false
    form.agreedToPrivacy = false
    mode.value = 'login'
}

const toggleMode = () => {
    mode.value = mode.value === 'login' ? 'signup' : 'login'
    form.name = ''
    form.email = ''
    form.password = ''
    form.error = ''
    form.agreedToTerms = false
    form.agreedToPrivacy = false
}

const canSubmit = computed(() => {
    if (mode.value !== 'signup') return true
    return form.agreedToTerms && form.agreedToPrivacy
})

const submit = async () => {
    if (!canSubmit.value) return
    form.error = ''
    form.isLoading = true
    try {
        if (mode.value === 'login') {
            await authEffect.login(form.email, form.password)
        } else {
            await authEffect.signup(form.name, form.email, form.password)
        }
        emit('success')
    } catch (e) {
        form.error = e instanceof Error ? e.message : '오류가 발생했습니다.'
    } finally {
        form.isLoading = false
    }
}

const handleLogout = async () => {
    await authEffect.logout()
    emit('logout')
}

const showAdminLink = computed(() => hasAdminAccess(authStore.user.value?.role))

const goToAdmin = () => {
    navigateTo('/admin')
    emit('success')
}

defineExpose({ reset })
</script>

<template>
    <div class="flex flex-col gap-4">
        <template v-if="authStore.isLoggedIn.value">
            <div class="flex items-center gap-3">
                <UAvatar
                    :src="authStore.user.value?.image ?? undefined"
                    :alt="authStore.user.value?.name ?? '사용자'"
                    icon="i-lucide-user"
                    size="lg"
                />
                <div>
                    <p class="font-medium">{{ authStore.user.value?.name }}</p>
                    <p class="text-sm text-(--ui-text-muted)">{{ authStore.user.value?.email }}</p>
                </div>
            </div>
            <UButton
                v-if="showAdminLink"
                variant="outline"
                color="primary"
                icon="i-lucide-shield"
                label="관리자 페이지"
                block
                @click="goToAdmin"
            />
            <UButton
                variant="outline"
                color="error"
                icon="i-lucide-log-out"
                label="로그아웃"
                block
                @click="handleLogout"
            />
        </template>
        <template v-else>
            <label v-if="mode === 'signup'" class="flex flex-col gap-1">
                <span class="text-sm font-medium">이름</span>
                <UInput v-model="form.name" placeholder="사용자 이름" autocomplete="name" />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium">이메일</span>
                <UInput
                    v-model="form.email"
                    type="email"
                    placeholder="email@example.com"
                    autocomplete="email"
                />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium">비밀번호</span>
                <UInput
                    v-model="form.password"
                    type="password"
                    placeholder="비밀번호"
                    autocomplete="current-password"
                />
            </label>
            <template v-if="mode === 'signup'">
                <label class="flex items-start gap-2 cursor-pointer">
                    <UCheckbox v-model="form.agreedToTerms" class="mt-0.5 shrink-0" />
                    <span class="text-sm text-(--ui-text-muted)">
                        <a href="/policy/terms" target="_blank" class="underline text-(--ui-text-default)">이용약관</a>에 동의합니다 (필수)
                    </span>
                </label>
                <label class="flex items-start gap-2 cursor-pointer">
                    <UCheckbox v-model="form.agreedToPrivacy" class="mt-0.5 shrink-0" />
                    <span class="text-sm text-(--ui-text-muted)">
                        <a href="/policy/privacy" target="_blank" class="underline text-(--ui-text-default)">개인정보처리방침</a>에 동의합니다 (필수)
                    </span>
                </label>
            </template>
            <div v-if="form.error" class="text-sm text-(--ui-text-error) flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" />
                {{ form.error }}
            </div>
            <UButton
                color="primary"
                :label="mode === 'login' ? '로그인' : '가입'"
                :loading="form.isLoading"
                :disabled="!canSubmit"
                block
                @click="submit"
            />
            <button
                type="button"
                class="text-sm text-center text-(--ui-text-muted) hover:text-(--ui-text-default) cursor-pointer"
                @click="toggleMode"
            >
                {{
                    mode === 'login'
                        ? '계정이 없으신가요? 회원가입'
                        : '이미 계정이 있으신가요? 로그인'
                }}
            </button>
        </template>
    </div>
</template>
