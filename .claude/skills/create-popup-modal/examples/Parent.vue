<script setup lang="ts">
const activeId = ref<string | null>(null);
const payload = ref<unknown | null>(null);

function toggle(id: string, item?: unknown) {
  if (activeId.value === id) {
    activeId.value = null;
    payload.value = null;
    return;
  }
  activeId.value = id;
  payload.value = item ?? null;
}

watch(activeId, (id) => {
  document.body.style.overflow = id ? 'hidden' : '';
});
</script>

<template>
  <div v-for="item in items" :key="item.id">
    <button
      class="chip-button"
      :class="{ 'is-active': activeId === item.id }"
      @click="toggle(item.id, item)"
    >
      {{ item.label }}
    </button>

    <Teleport to="#modal-root">
      <div
        v-if="activeId === item.id"
        :id="`popup-${item.id}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`popup-title-${item.id}`"
        class="modal-popup-wrapper"
      >
        <PopupContent :payload="payload" @close="toggle(item.id)" />
      </div>
    </Teleport>
  </div>
</template>
