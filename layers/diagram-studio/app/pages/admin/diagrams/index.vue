<script setup lang="ts">
import { navigateTo } from '#imports'

definePageMeta({ ssr: false })

// /admin/diagrams 진입 시 기본 탭(fsd)으로 리다이렉트
await navigateTo('/admin/diagrams/fsd', { replace: true })
</script>

<template>
    <div />
</template>
