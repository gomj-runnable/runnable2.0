<script setup lang="ts">
/**
 * 플러그인 확장 슬롯(chip)이 정상 동작하는지 확인하는 데모 플러그인.
 * 자체 위치(상단 중앙)를 직접 관리한다.
 */
const toast = useToast()
const active = ref(false)

function onClick() {
    active.value = !active.value
    toast.add({
        title: '플러그인 데모',
        description: '플러그인 확장 슬롯이 정상 동작합니다.',
        icon: 'i-lucide-puzzle',
        color: 'info'
    })
}
</script>

<template>
    <div class="demo-plugin-chip">
        <UButton
            label="플러그인 데모"
            icon="i-lucide-puzzle"
            size="md"
            :variant="active ? 'solid' : 'outline'"
            :color="active ? 'primary' : 'neutral'"
            class="rounded-full shadow"
            @click="onClick"
        />
    </div>
</template>

<style scoped>
.demo-plugin-chip {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    pointer-events: auto;
}
</style>
