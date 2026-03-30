<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

const toast = useToast()
const authClient = useAuthClient()

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true
  }
]

/**
 * 이메일과 비밀번호 형식을 검사하는 함수
 *
 * 이메일 생성 규칙: @ 필수 입력
 * 비밀번호 입력 규칙: 8자 이상 입력
 */
const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, '비밀번호는 8자 이상입니다.')
})

type Schema = z.output<typeof schema>

/**
 * 로그인 버튼을 누를 시 발생하는 이벤트
 * @param payload UAuthForm 반환값
 */
async function onLogin(payload: FormSubmitEvent<Schema>) {
  // form 데이터 취득
  const email = payload.data.email
  const password = payload.data.password

  try {
    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true // 세션 쿠키 저장
    })

    if (result.error) {
      toast.add({ title: `에러 발생: 다시 로그인해주세요!`, color: 'warning' })
      console.error(result.error)
      return
    }

    toast.add({ title: '로그인 성공 환영합니다!', color: 'success' })
    await navigateTo('/admin')
  } catch (error) {
    toast.add({ title: `505: 예기치 못한 에러 발생! ${error}`, color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        method="post"
        action="#"
        :schema="schema"
        title="영복교회에 오신것을 환영합니다."
        description="아이디와 비밀번호를 입력해주세요!"
        icon="i-lucide-user"
        :fields="fields"
        @submit.prevent="onLogin"
      />
    </UPageCard>
  </div>
</template>

<style scoped></style>
