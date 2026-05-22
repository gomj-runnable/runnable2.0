import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
    sanitizeId,
    shortLabel,
    extractVueScript,
    extractImportSpecifiers,
    escapeMermaidLabel,
    collectSourceFiles
} from '../common'

describe('sanitizeId()', () => {
    it('영숫자/언더스코어 외 문자는 _ 로 치환', () => {
        expect(sanitizeId('a/b.c-d')).toBe('a_b_c_d')
    })

    it('숫자로 시작하면 _ prefix', () => {
        expect(sanitizeId('123abc')).toBe('_123abc')
    })

    it('영문자로 시작하면 그대로', () => {
        expect(sanitizeId('abc123')).toBe('abc123')
    })
})

describe('shortLabel()', () => {
    it('repoRoot 기준 상대경로', () => {
        expect(shortLabel('/repo/app/Foo.ts', '/repo')).toBe('app/Foo.ts')
    })
})

describe('extractVueScript()', () => {
    it('<script setup> 내부만 추출', () => {
        const src = `<template><div /></template>\n<script setup>const x = 1</script>`
        expect(extractVueScript(src).trim()).toBe('const x = 1')
    })

    it('script 태그 없으면 빈 문자열', () => {
        expect(extractVueScript('<template>x</template>')).toBe('')
    })

    it('lang/setup 같은 속성 포함도 매칭', () => {
        const src = `<script lang="ts" setup>const x = 1</script>`
        expect(extractVueScript(src).trim()).toBe('const x = 1')
    })
})

describe('extractImportSpecifiers()', () => {
    it('import from "X" 형태 모두 추출', () => {
        const code = `
import a from './a'
import { b } from "./b"
import 'side-effect-only'
        `
        expect(extractImportSpecifiers(code).sort()).toEqual(
            ['./a', './b', 'side-effect-only'].sort()
        )
    })

    it('import 가 없으면 빈 배열', () => {
        expect(extractImportSpecifiers('const x = 1')).toEqual([])
    })
})

describe('escapeMermaidLabel()', () => {
    it('" → &quot;, ` → &#96;', () => {
        expect(escapeMermaidLabel('a"b`c')).toBe('a&quot;b&#96;c')
    })
})

describe('collectSourceFiles()', () => {
    let tmpDir: string

    beforeEach(async () => {
        tmpDir = join(tmpdir(), `uml-collect-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(join(tmpDir, 'sub'), { recursive: true })
        await mkdir(join(tmpDir, '__tests__'), { recursive: true })
        await writeFile(join(tmpDir, 'a.ts'), 'export const a = 1')
        await writeFile(join(tmpDir, 'b.vue'), '<template/>')
        await writeFile(join(tmpDir, 'c.md'), '# skip')
        await writeFile(join(tmpDir, 'sub', 'd.tsx'), 'export const d = 1')
        await writeFile(join(tmpDir, '__tests__', 'skip.ts'), 'skip')
    })

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true })
    })

    it('.ts/.tsx/.vue 만 수집하고 __tests__ 디렉터리는 스킵', async () => {
        const files = await collectSourceFiles([tmpDir])
        const rels = files.map((f) => f.replace(tmpDir + '/', '')).sort()
        expect(rels).toEqual(['a.ts', 'b.vue', 'sub/d.tsx'])
    })

    it('존재하지 않는 경로는 무시', async () => {
        const files = await collectSourceFiles([join(tmpDir, 'nonexistent')])
        expect(files).toEqual([])
    })

    it('파일 경로를 직접 주면 그 파일만', async () => {
        const files = await collectSourceFiles([join(tmpDir, 'a.ts')])
        expect(files).toHaveLength(1)
    })
})
