<script setup lang="ts">
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
    <AuthSlideOverContent
        ref="inner"
        @success="emit('success')"
        @logout="emit('logout')"
    />
</template>
