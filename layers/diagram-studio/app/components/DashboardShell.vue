<script setup lang="ts">
import type { DiagramJSON } from '../../runtime/types'

defineProps<{
    meta?: DiagramJSON['meta'] | null
    activeTab?: string
}>()

defineEmits<{
    'update:activeTab': [tab: string]
}>()
</script>

<template>
    <UDashboardGroup
        storage="local"
        storage-key="diagram-studio"
        class="ds-group"
        aria-label="다이어그램 스튜디오 워크스페이스"
    >
        <!-- Left sidebar -->
        <UDashboardSidebar
            id="ds-sidebar"
            :resizable="false"
            class="ds-sidebar-panel"
            :ui="{
                root: 'ds-sidebar-panel__root',
                header: 'ds-sidebar-panel__header',
                body: 'ds-sidebar-panel__body'
            }"
        >
            <template #header>
                <!-- Brand -->
                <div class="ds-brand" aria-label="Diagram Studio 브랜드">
                    <span class="ds-brand__logo" aria-hidden="true">
                        <span class="ds-brand__bracket">[</span>DS<span class="ds-brand__bracket"
                            >]</span
                        >
                    </span>
                    <span class="ds-brand__title">Diagram Studio</span>
                    <UBadge
                        label="v1"
                        color="neutral"
                        variant="outline"
                        size="xs"
                        class="ds-brand__badge"
                        aria-label="버전"
                    />
                </div>
            </template>

            <!-- Sidebar content slot -->
            <slot name="sidebar" />
        </UDashboardSidebar>

        <!-- Main panel: navbar + canvas + detail -->
        <UDashboardPanel id="ds-main" class="ds-main-panel">
            <template #header>
                <UDashboardNavbar
                    :toggle="false"
                    class="ds-navbar"
                    :ui="{ root: 'ds-navbar__root' }"
                >
                    <template #left>
                        <!-- Tab navigation -->
                        <nav class="ds-navbar__tabs" aria-label="다이어그램 탭">
                            <slot name="tabs" />
                        </nav>
                    </template>

                    <template #right>
                        <!-- Meta information -->
                        <div
                            class="ds-navbar__meta"
                            aria-label="다이어그램 메타 정보"
                            role="status"
                        >
                            <template v-if="meta">
                                <span class="ds-meta-item">
                                    <span class="ds-meta-label">gen</span>
                                    <span class="ds-meta-value">{{
                                        new Date(meta.generatedAt).toLocaleString('ko-KR', {
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                    }}</span>
                                </span>
                                <span class="ds-meta-sep" aria-hidden="true">/</span>
                                <span class="ds-meta-item">
                                    <span class="ds-meta-label">sha</span>
                                    <UBadge
                                        :label="meta.sourceCommit.slice(0, 7)"
                                        color="primary"
                                        variant="soft"
                                        size="xs"
                                        class="ds-meta-commit"
                                    />
                                </span>
                                <span class="ds-meta-sep" aria-hidden="true">/</span>
                                <span class="ds-meta-item">
                                    <span class="ds-meta-label">N</span>
                                    <span class="ds-meta-value">{{ meta.nodeCount }}</span>
                                </span>
                                <span class="ds-meta-sep" aria-hidden="true">+</span>
                                <span class="ds-meta-item">
                                    <span class="ds-meta-label">E</span>
                                    <span class="ds-meta-value">{{ meta.edgeCount }}</span>
                                </span>
                            </template>
                            <template v-else>
                                <span class="ds-meta-empty">no data</span>
                            </template>
                        </div>
                    </template>
                </UDashboardNavbar>
            </template>

            <!-- Canvas + detail overlay -->
            <div class="ds-body">
                <main class="ds-body__canvas" aria-label="다이어그램 캔버스 영역">
                    <slot name="canvas" />
                </main>
                <aside class="ds-body__detail" aria-label="노드 상세 패널">
                    <slot name="detail" />
                </aside>
            </div>
        </UDashboardPanel>
    </UDashboardGroup>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');

/* Keep ds-* tokens for terminal aesthetic — mapped onto UI neutral palette */
:root {
    --ds-bg: #080b0f;
    --ds-bg-elevated: #0d1117;
    --ds-border: #1e2d3d;
    --ds-border-subtle: #152232;
    --ds-primary: #00d4a8;
    --ds-accent: #ff6b35;
    --ds-text: #c9d8e8;
    --ds-text-muted: #4a6580;
    --ds-text-dim: #2a4060;
    --ds-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    --ds-font-sans: 'DM Sans', system-ui, sans-serif;
    --ds-transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

<style scoped>
/* ── DashboardGroup override ── */
.ds-group {
    height: 100dvh;
    background: var(--ds-bg);
    color: var(--ds-text);
    font-family: var(--ds-font-sans);
    /* Engineering blueprint dot grid */
    background-image: radial-gradient(
        circle at 1px 1px,
        var(--ds-border-subtle) 1px,
        transparent 0
    );
    background-size: 32px 32px;
}

/* ── Sidebar panel ── */
:deep(.ds-sidebar-panel__root) {
    border-right: 1px solid var(--ds-border);
    background: var(--ds-bg-elevated);
    width: 280px;
    min-width: 280px;
    max-width: 280px;
    flex-shrink: 0;
}

:deep(.ds-sidebar-panel__header) {
    border-bottom: 1px solid var(--ds-border);
    padding: 0 1rem;
    height: 48px;
    display: flex;
    align-items: center;
}

:deep(.ds-sidebar-panel__body) {
    padding: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ds-border) transparent;
}

/* ── Brand ── */
.ds-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.ds-brand__logo {
    font-family: var(--ds-font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ds-primary);
    letter-spacing: -0.02em;
    white-space: nowrap;
}

.ds-brand__bracket {
    color: var(--ds-text-muted);
}

.ds-brand__title {
    font-family: var(--ds-font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ds-text);
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.ds-brand__badge {
    font-family: var(--ds-font-mono);
    letter-spacing: 0.05em;
}

/* ── Main panel ── */
:deep(.ds-main-panel) {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    background: var(--ds-bg);
}

/* ── Navbar ── */
:deep(.ds-navbar__root) {
    border-bottom: 1px solid var(--ds-border);
    background: rgba(8, 11, 15, 0.95);
    backdrop-filter: blur(8px);
    height: 48px;
    padding: 0 1rem;
    position: relative;
}

:deep(.ds-navbar__root)::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent,
        var(--ds-primary) 40%,
        var(--ds-primary) 60%,
        transparent
    );
    opacity: 0.25;
    pointer-events: none;
}

.ds-navbar__tabs {
    display: flex;
    align-items: stretch;
    height: 48px;
    overflow-x: auto;
    scrollbar-width: none;
}

.ds-navbar__tabs::-webkit-scrollbar {
    display: none;
}

/* ── Meta ── */
.ds-navbar__meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding-left: 1rem;
    border-left: 1px solid var(--ds-border);
    height: 100%;
    flex-shrink: 0;
}

.ds-meta-item {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    white-space: nowrap;
}

.ds-meta-label {
    font-family: var(--ds-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    color: var(--ds-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.ds-meta-value {
    font-family: var(--ds-font-mono);
    font-size: 0.6875rem;
    color: var(--ds-text-muted);
}

.ds-meta-commit {
    font-family: var(--ds-font-mono);
}

.ds-meta-sep {
    font-family: var(--ds-font-mono);
    font-size: 0.625rem;
    color: var(--ds-text-dim);
}

.ds-meta-empty {
    font-family: var(--ds-font-mono);
    font-size: 0.6875rem;
    color: var(--ds-text-dim);
    font-style: italic;
}

/* ── Body: canvas + detail ── */
.ds-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
}

.ds-body__canvas {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.ds-body__detail {
    flex-shrink: 0;
}
</style>
