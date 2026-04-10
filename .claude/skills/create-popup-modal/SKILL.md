# Create Popup Modal

Vue 3 Chip Button + Modal Popup 구현 규칙.

## 구조

```
ParentElement
├── .chip-button          ← Trigger (toggle 호출)
└── .modal-popup-wrapper  ← 부모와 동일 width/height, 내부 스크롤
    └── [ModalContent]
```

`id="popup-${id}"`로 Chip Button과 Modal이 상태를 공유한다.

## 상태 관리

- `activeId` + `payload` 쌍으로 상위(Parent)에서 관리
- `toggle`이 `activeId`를 교체 → 이전 모달 자동 닫힘 (`.single` 조건)
- 다중 독립 모달이 필요할 때만 `activeId`를 배열로 확장

→ 코드: [examples/state.md](examples/state.md)

## 컴포넌트 분리

| 컴포넌트 | 역할 |
|----------|------|
| `ChipButton` | `.chip-button` trigger, 클릭 시 `toggle` 호출 |
| `ModalBase` | `.modal-popup-wrapper` shell, teleport(`#modal-root` → `body`), dimmer, Esc 닫기 |
| `PopupContent` | 실제 콘텐츠, `payload` props 수신 |

## 흐름

ChipButton click → `toggle(id, item)` → `v-if` 충족 → ModalBase(teleport) → PopupContent(payload) → 닫기(Esc/dimmer/X) → `activeId = null`

## CSS 제약

- `.modal-popup-wrapper`: `position: fixed` 또는 부모 `overflow: hidden` 경계 내 배치
- `max-height: 90dvh`, `overflow-y: auto`는 wrapper에 적용
- → 코드: [examples/css.md](examples/css.md)

## 접근성

`role="dialog"` + `aria-modal="true"` + `aria-labelledby` + 오픈 시 첫 포커스 이동 + `Esc` 닫기

## 점검 항목

- `id="popup-${id}"`가 Chip Button과 Modal에서 일치하는가
- 스크롤이 wrapper 내부에서만 동작하는가
- `.single` 조건: `activeId`가 하나만 유지되는가
- `Esc` 닫기와 `aria-modal` 적용되었는가
- 모달 오픈 시 `body` scroll이 잠기는가
