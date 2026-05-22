import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { frontendFlowchart, frontendClass, buildFrontendDiagram } from '../frontend'
import type { Feature } from '~~/shared/types/uml'

// frontend.ts 는 fs.access / fs.stat 으로 import resolve 를 하므로 실제 임시 디렉터리에
// 파일 트리를 만들고 process.cwd() 를 그쪽으로 임시 redirect 한 뒤 테스트한다.

describe('frontendFlowchart()', () => {
    let tmpDir: string

    beforeEach(async () => {
        tmpDir = join(tmpdir(), `uml-fe-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(join(tmpDir, 'src'), { recursive: true })
    })

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true })
    })

    const featureWithAbsPath = (subdir = 'src'): Feature => ({
        id: 'fx',
        domain: 'frontend' as any,
        name: 'x',
        paths: [join(tmpDir, subdir)], // 절대경로 — resolve(repoRoot, abs) → abs
        fileCount: 0,
        detectedAt: '2026-05-15T00:00:00Z'
    })

    it('files 0 → "no source files"', async () => {
        const mmd = await frontendFlowchart(featureWithAbsPath())
        expect(mmd).toContain('no source files')
    })

    it('local relative import → 같은 feature 내부 노드로 연결', async () => {
        await writeFile(join(tmpDir, 'src', 'a.ts'), `import { b } from './b'\nexport const a = b`)
        await writeFile(join(tmpDir, 'src', 'b.ts'), `export const b = 1`)

        const mmd = await frontendFlowchart(featureWithAbsPath())
        expect(mmd).toContain('flowchart LR')
        expect(mmd).toContain('-->')
    })

    it('외부 패키지 import 는 무시', async () => {
        await writeFile(
            join(tmpDir, 'src', 'a.ts'),
            `import { x } from 'lodash'\nimport { y } from './missing'`
        )
        const mmd = await frontendFlowchart(featureWithAbsPath())
        expect(mmd).not.toContain('lodash')
        expect(mmd).not.toContain('-->')
    })

    it('Vue 파일은 <script setup> 만 추출', async () => {
        await writeFile(
            join(tmpDir, 'src', 'A.vue'),
            `<template>x</template>\n<script setup>import { b } from './b'</script>`
        )
        await writeFile(join(tmpDir, 'src', 'b.ts'), `export const b = 1`)
        const mmd = await frontendFlowchart(featureWithAbsPath())
        expect(mmd).toContain('-->')
    })
})

describe('frontendClass()', () => {
    let tmpDir: string

    beforeEach(async () => {
        tmpDir = join(tmpdir(), `uml-fc-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(join(tmpDir, 'src'), { recursive: true })
    })

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true })
    })

    const feature = (): Feature => ({
        id: 'fx',
        domain: 'frontend' as any,
        name: 'x',
        paths: [join(tmpDir, 'src')],
        fileCount: 0,
        detectedAt: '2026-05-15T00:00:00Z'
    })

    it('files 0 → "class Empty"', async () => {
        const mmd = await frontendClass(feature())
        expect(mmd).toContain('class Empty')
    })

    it('Vue 의 defineProps<{...}>() — 타입 멤버 분해', async () => {
        await writeFile(
            join(tmpDir, 'src', 'A.vue'),
            `<script setup>defineProps<{ a: string; b: number }>()</script>`
        )
        const mmd = await frontendClass(feature())
        expect(mmd).toContain('+a:')
        expect(mmd).toContain('+b:')
    })

    it('defineProps() literal — 단일 props 라인', async () => {
        await writeFile(
            join(tmpDir, 'src', 'A.vue'),
            `<script setup>defineProps( ['name', 'count'] )</script>`
        )
        const mmd = await frontendClass(feature())
        expect(mmd).toContain('+props:')
    })

    it('defineEmits<{...}>() — 이벤트별 멤버 분해', async () => {
        await writeFile(
            join(tmpDir, 'src', 'A.vue'),
            `<script setup>defineEmits<{ click: [Event]; save: [] }>()</script>`
        )
        const mmd = await frontendClass(feature())
        expect(mmd).toContain('+@click:')
        expect(mmd).toContain('+@save:')
    })

    it('export const/function 시그니처 추가', async () => {
        await writeFile(
            join(tmpDir, 'src', 'a.ts'),
            `export const useX = () => {}\nexport function helper() {}`
        )
        const mmd = await frontendClass(feature())
        expect(mmd).toContain('+const useX')
        expect(mmd).toContain('+function helper')
    })
})

describe('buildFrontendDiagram()', () => {
    let tmpDir: string

    beforeEach(async () => {
        tmpDir = join(tmpdir(), `uml-bf-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(join(tmpDir, 'src'), { recursive: true })
    })

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true })
    })

    it('type=class → frontendClass', async () => {
        const mmd = await buildFrontendDiagram(
            {
                id: 'x',
                domain: 'frontend' as any,
                name: 'x',
                paths: [join(tmpDir, 'src')],
                fileCount: 0,
                detectedAt: ''
            },
            'class'
        )
        expect(mmd).toContain('classDiagram')
    })

    it('그 외 type → frontendFlowchart', async () => {
        const mmd = await buildFrontendDiagram(
            {
                id: 'x',
                domain: 'frontend' as any,
                name: 'x',
                paths: [join(tmpDir, 'src')],
                fileCount: 0,
                detectedAt: ''
            },
            'flowchart'
        )
        expect(mmd).toContain('flowchart LR')
    })
})
