<script setup lang="ts">
// SlideOver 인증 탭 — AuthSlideOverContent를 래핑하고 reset() 메서드를 외부에 노출한다.
import AuthSlideOverContent from '~/entities/user/ui/AuthSlideOverContent.vue'

const emit = defineEmits<{
    success: []
    logout: []
}>()

const inner = ref<InstanceType<typeof AuthSlideOverContent> | null>(null)

defineExpose({
    reset: () => inner.value?.reset()
})
</script>

<template>
    <AuthSlideOverContent ref="inner" @success="emit('success')" @logout="emit('logout')" />
</template>
