---
name: create-map-overlay
description: This skill should be used when the user asks to "지도 위 오버레이 UI를 추가", "맵 오버레이 컨트롤을 만들어", "Overlay 컴포넌트를 구현", "지도 위에 떠 있는 패널/컨트롤을 추가"해야 할 때. MapShell의 #overlay 슬롯에 배치되는 부유 UI의 공통 구조와 CSS 패턴을 정의한다.
---

# Create Map Overlay

MapShell `#overlay` 슬롯에 배치되는 부유 UI 구현 규칙.

## 구조

```
MapShell #overlay
└── .{name}-overlay              ← 전체 영역 (pointer-events: none)
    └── .{name}-overlay__topbar  ← 컨트롤 영역 (pointer-events: auto)
        └── .{name}-overlay__controls
            ├── [ControlA]       ← molecule 컴포넌트
            ├── [ControlB]
            └── [Legend/Info]
```

Overlay는 지도 위에 떠 있는 **비모달 컨트롤 패널**이다. PopupModal과 다르게 지도 인터랙션을 차단하지 않는다.

## 핵심 원칙

| 항목 | 규칙 |
|------|------|
| 컨테이너 | `position: absolute; inset: 0; pointer-events: none` — 지도 클릭 투과 |
| 컨트롤 영역 | `pointer-events: auto` — 실제 UI만 클릭 가능 |
| z-index | semantic token 사용 (`--z-{name}-overlay`), `--z-panel(10)` 이상 `--z-modal(100)` 미만 |
| surface | glass-morphism: `backdrop-filter: var(--blur)` + `var(--color-surface-elevated)` |
| 레이아웃 | topbar는 `flex`, controls는 `flex-direction: column` + `gap` |

## 컨트롤 아이템 패턴

Overlay 내 개별 컨트롤(버튼, 셀렉트, 토글 등)은 공통 surface 스타일을 따른다.

```css
.{name}-overlay__{control} {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-2);
    padding: var(--gap-2) var(--gap-3);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-control-lg);
    font-size: var(--text-body-xs);
    backdrop-filter: var(--blur);
    box-shadow: var(--shadow-sm);
}
```

## 상태 관리

- Overlay 자체 상태(열림/닫힘, 활성 레이어 등)는 **store** composable에서 관리
- 내부 sub-modal(달력 팝업 등)은 Overlay 내 `ref`로 로컬 관리
- 외부 데이터 fetch는 **sideeffect** composable에 위임
- 데이터 변환은 **action** composable에 위임

## PopupModal과의 차이

| | Map Overlay | PopupModal |
|---|---|---|
| 목적 | 지도 위 상시 컨트롤 | 일시적 다이얼로그 |
| 지도 인터랙션 | 투과 (pointer-events: none) | 차단 (dimmer) |
| z-index | `10–99` | `100+` |
| 닫기 방식 | 토글/조건부 | Esc/dimmer/X |
| body scroll | 잠금 없음 | 잠금 |

Overlay 안에서 PopupModal을 사용할 수 있다 (예: 날짜 선택 달력).

## 새 Overlay 추가 절차

1. **semantic token 등록** — `semantic.css`에 `--z-{name}-overlay` 추가
2. **Vue 컴포넌트 생성** — `app/components/map/templates/{Name}Overlay.vue`
3. **외부 CSS 생성** — `app/assets/css/components/templates/{Name}Overlay.css`
4. **molecule 분리** — 내부 컨트롤은 `molecules/{name}/` 하위에 배치
5. **store 연결** — 상태는 `composables/store/use{Name}Store.ts`
6. **MapShell 연결** — `#overlay` 슬롯에 배치

→ 코드: [examples/template.vue](examples/template.vue), [examples/css.md](examples/css.md)

## CSS 제약

- 컨테이너: `position: absolute; inset: 0` 필수
- `pointer-events: none` → 자식 컨트롤에서 `auto` 복원
- 색상/크기/간격은 semantic token 우선
- `<style scoped src="...">` 외부 CSS만 사용
- → 코드: [examples/css.md](examples/css.md)

## 점검 항목

- 컨테이너에 `pointer-events: none`이 적용되었는가
- 컨트롤 영역에 `pointer-events: auto`가 복원되었는가
- z-index가 semantic token으로 정의되었는가 (`--z-modal` 미만)
- 컨트롤 아이템이 glass-morphism surface 패턴을 따르는가
- molecule이 composable·전역 상태에 의존하지 않는가
- 내부 sub-modal이 PopupModal을 사용하는가
- 외부 CSS 파일로 분리되었는가
