import { promises as fs } from 'node:fs'
import { extname, join, relative } from 'node:path'

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.vue'])
const SKIP_DIRS = new Set(['__tests__', '__mocks__', 'node_modules', '.nuxt', '.output'])

export async function collectSourceFiles(absRoots: string[]): Promise<string[]> {
    const result: string[] = []
    for (const root of absRoots) {
        await walk(root, result)
    }
    return result
}

async function walk(p: string, out: string[]) {
    let stat: import('node:fs').Stats
    try {
        stat = await fs.stat(p)
    } catch {
        return
    }
    if (stat.isFile()) {
        if (SOURCE_EXTS.has(extname(p))) out.push(p)
        return
    }
    if (!stat.isDirectory()) return
    const entries = await fs.readdir(p, { withFileTypes: true })
    for (const ent of entries) {
        if (ent.isDirectory() && SKIP_DIRS.has(ent.name)) continue
        await walk(join(p, ent.name), out)
    }
}

/**
 * mermaid 노드 ID 로 안전한 ASCII 토큰. label 은 따옴표로 별도 표시.
 */
export function sanitizeId(input: string): string {
    return input.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1')
}

export function shortLabel(absPath: string, repoRoot: string): string {
    return relative(repoRoot, absPath)
}

/**
 * <script setup ...>...</script> 블록만 추출. 매칭 실패 시 빈 문자열.
 */
export function extractVueScript(source: string): string {
    const m = source.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
    return m?.[1] ?? ''
}

const IMPORT_RE = /import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g

export function extractImportSpecifiers(source: string): string[] {
    const out: string[] = []
    let m: RegExpExecArray | null
    while ((m = IMPORT_RE.exec(source)) !== null) {
        if (m[1]) out.push(m[1])
    }
    return out
}

export function escapeMermaidLabel(s: string): string {
    return s.replace(/"/g, '&quot;').replace(/`/g, '&#96;')
}
