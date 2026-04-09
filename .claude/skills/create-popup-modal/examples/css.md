# CSS — Popup Modal Wrapper

```css
.modal-popup-wrapper {
  position: fixed;          /* 부모가 overflow: hidden이면 absolute */
  inset: 0;
  width: 100%;
  height: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```
