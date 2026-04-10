# Overlay CSS 패턴

## 컨테이너 (필수)

```css
.{name}-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    z-index: var(--z-{name}-overlay, 12);
}
```

## Topbar (컨트롤 영역)

```css
.{name}-overlay__topbar {
    display: flex;
    align-items: flex-start;
    gap: var(--gap-section-sm);
    padding: var(--gap-section-md);
    pointer-events: auto;
}

.{name}-overlay__controls {
    display: flex;
    flex-direction: column;
    gap: var(--gap-section-xs);
}
```

## 컨트롤 아이템 (glass-morphism surface)

버튼, 셀렉트, 토글 등 개별 컨트롤에 공통 적용:

```css
.{name}-overlay__{control} {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-2);
    padding: var(--gap-2) var(--gap-3);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-control-lg);
    color: var(--text-primary);
    font-size: var(--text-body-xs);
    backdrop-filter: var(--blur);
    box-shadow: var(--shadow-sm);
}

/* hover */
.{name}-overlay__{control}:hover {
    background: var(--color-surface-soft);
}

/* 비활성/데이터 없음 상태 */
.{name}-overlay__{control}.is-no-data {
    border-color: var(--color-border-subtle);
    color: var(--text-muted);
}
```

## Select 래퍼

```css
.{name}-overlay__{select-wrap} {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-2);
    padding: var(--gap-2) var(--gap-3);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-control-lg);
    backdrop-filter: var(--blur);
    box-shadow: var(--shadow-sm);
}

.{name}-overlay__{select} {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    outline: none;
}
```

## Sub-modal (Overlay 내 PopupModal)

```css
.{name}-overlay__{modal-panel} {
    width: min(360px, calc(100vw - var(--gap-section-xl)));
}

.{name}-overlay__{modal} {
    display: flex;
    flex-direction: column;
    gap: var(--gap-section-sm);
    padding: var(--gap-section-md);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-surface-lg);
    background: var(--color-surface-elevated);
    box-shadow: var(--shadow-frame);
}

.{name}-overlay__{modal-header} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-section-sm);
}

.{name}-overlay__{modal-title} {
    margin: 0;
    font-size: var(--text-label-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.{name}-overlay__{close} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-control-md);
    background: var(--color-surface-soft);
    color: var(--text-primary);
    cursor: pointer;
}

.{name}-overlay__{close}:hover {
    background: var(--color-surface-soft-hover);
}
```

## semantic.css에 z-index 등록

```css
/* semantic.css */
--z-{name}-overlay: 12;  /* --z-panel(10) 이상, --z-modal(100) 미만 */
```
