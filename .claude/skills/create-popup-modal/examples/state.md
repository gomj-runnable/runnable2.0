# State — Popup Modal

```ts
interface PopupState {
  activeId: string | null;
  payload: unknown | null;
}

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
```
