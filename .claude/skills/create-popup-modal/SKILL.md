# Create Popup Modal

Vue 3 기준 Chip Button + Modal Popup 구현 규칙.

## 1) 구조

한 세트는 **Chip Button** 하나와 **Modal Popup** 하나로 구성된다.

```
ParentElement
├── .chip-button          ← Trigger
└── .modal-popup-wrapper  ← 부모와 동일한 width/height, 스크롤 컨테이너
    └── [ModalContent]    ← 실제 콘텐츠
```

- `.chip-button` : 열기/닫기 Trigger
- `.modal-popup-wrapper` : 부모 요소와 동일한 `width`, `height`를 가지며, 내부 콘텐츠는 이 wrapper 안에서만 scroll된다.
- `id="popup-${id}"` : Chip Button과 Modal이 **동일한 id**를 참조해 상태를 공유하고 반응형 렌더링을 트리거한다.

## 2) 상태

단일 활성 상태를 상위(Parent)에서 관리한다. `activeId` + `payload` 쌍으로 보관한다.

`.single` 조건: `toggle`이 `activeId`를 교체하는 방식이므로 별도 처리 없이 자동으로 이전 모달을 닫는다.
다중 독립 모달이 필요한 경우에만 `activeId`를 배열로 확장한다.

→ 코드: [examples/state.md](examples/state.md)

## 3) 컴포넌트 분리

- **Trigger** `ChipButton` — `.chip-button`, 클릭 시 `toggle` 호출
- **Shell** `ModalBase` — `.modal-popup-wrapper`, teleport, dimmer, Esc 닫기
- **Content** `PopupContent` — 실제 콘텐츠 렌더링, `payload` 수신

## 4) 흐름

```
ChipButton (click)
  → toggle(id, item)       // Parent 상태 변경
  → v-if 조건 충족
  → ModalBase 렌더링        // teleport to #modal-root
  → PopupContent 렌더링     // payload props 전달
  → 닫기(Esc / dimmer / X)
  → activeId = null
```

## 5) CSS / Overflow 제약

- `.modal-popup-wrapper`는 `position: fixed` 또는 부모 `overflow: hidden` 경계 안에 두어 **윈도우 밖 overflow를 방지**한다.
- `max-height: 90dvh`로 뷰포트 높이를 제한한다.
- 스크롤은 wrapper 내부에서만 발생하도록 `overflow-y: auto`를 wrapper에 적용한다.

→ 코드: [examples/css.md](examples/css.md)

## 6) 접근성

- `role="dialog"` + `aria-modal="true"` 필수
- `aria-labelledby`로 모달 제목 연결
- 모달 오픈 시 첫 번째 포커스 가능한 요소로 포커스 이동
- `Esc` 키로 닫기

## 7) Teleport

모달은 `#modal-root` (없으면 `body`)로 teleport한다.

→ 전체 예시: [examples/Parent.vue](examples/Parent.vue)

## 8) 체크리스트

- [ ] `id="popup-${id}"` 가 Chip Button과 Modal에서 동일하게 참조되는가
- [ ] `.modal-popup-wrapper`가 부모와 동일한 `width`, `height`를 갖는가
- [ ] 스크롤이 wrapper 내부에서만 동작하는가
- [ ] 마우스가 윈도우 밖으로 나가도 overflow가 없는가
- [ ] `.single` 조건: 하나의 `activeId`만 유지되는가
- [ ] `Esc` 닫기와 `aria-modal` 접근성이 적용되었는가
- [ ] 모달 오픈 시 `body` scroll이 잠기는가
