import { promises as fs } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { Feature, DiagramType } from '~~/shared/types/uml'
import { repoRoot } from '../paths'
import {
    collectSourceFiles,
    extractImportSpecifiers,
    extractVueScript,
    sanitizeId,
    shortLabel,
    escapeMermaidLabel
} from './common'

function isLocalImport(spec: string): boolean {
    return (
        spec.startsWith('.') ||
        spec.startsWith('~') ||
        spec.startsWith('@/') ||
        spec.startsWith('~~')
    )
}

function resolveAlias(spec: string): string | null {
    if (spec.startsWith('~~/') || spec.startsWith('@@/')) return resolve(repoRoot, spec.slice(3))
    if (spec.startsWith('~/') || spec.startsWith('@/'))
        return resolve(repoRoot, 'app', spec.slice(2))
    return null
}

const TRY_EXTS = ['.ts', '.tsx', '.vue', '.mjs', '.js']
const TRY_INDEX = ['/index.ts', '/index.tsx', '/index.vue', '/index.js']

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p)
        return true
    } catch {
        return false
    }
}

async function tryResolve(absBase: string): Promise<string | null> {
    if (await exists(absBase)) {
        const stat = await fs.stat(absBase)
        if (stat.isFile()) return absBase
    }
    for (const ext of TRY_EXTS) {
        if (await exists(absBase + ext)) return absBase + ext
    }
    for (const idx of TRY_INDEX) {
        if (await exists(absBase + idx)) return absBase + idx
    }
    return null
}

async function resolveImport(fromFile: string, spec: string): Promise<string | null> {
    let absBase: string | null = null
    const aliased = resolveAlias(spec)
    if (aliased) absBase = aliased
    else if (spec.startsWith('.')) absBase = resolve(dirname(fromFile), spec)
    else if (isAbsolute(spec)) absBase = spec
    if (!absBase) return null
    return tryResolve(absBase)
}

async function readSource(file: string): Promise<string> {
    const raw = await fs.readFile(file, 'utf-8')
    return file.endsWith('.vue') ? extractVueScript(raw) : raw
}

export async function frontendFlowchart(feature: Feature): Promise<string> {
    const absRoots = feature.paths.map((p) => resolve(repoRoot, p))
    const files = await collectSourceFiles(absRoots)
    if (files.length === 0) return `flowchart LR\n  empty["(no source files)"]`

    const fileSet = new Set(files)
    const lines: string[] = ['flowchart LR']
    const declared = new Set<string>()

    function nodeFor(absPath: string): string {
        const id = sanitizeId(relative(repoRoot, absPath))
        if (!declared.has(id)) {
            const label = escapeMermaidLabel(shortLabel(absPath, repoRoot))
            lines.push(`  ${id}["${label}"]`)
            declared.add(id)
        }
        return id
    }

    const edges = new Set<string>()
    for (const file of files) {
        const fromId = nodeFor(file)
        const src = await readSource(file)
        const specs = extractImportSpecifiers(src)
        for (const spec of specs) {
            if (!isLocalImport(spec)) continue
            const resolved = await resolveImport(file, spec)
            if (!resolved) continue
            // 같은 feature 내부 파일만 그래프 노드로 표현
            if (!fileSet.has(resolved)) continue
            if (resolved === file) continue
            const toId = nodeFor(resolved)
            const key = `${fromId}->${toId}`
            if (edges.has(key)) continue
            edges.add(key)
            lines.push(`  ${fromId} --> ${toId}`)
        }
    }
    return lines.join('\n')
}

export async function frontendClass(feature: Feature): Promise<string> {
    const absRoots = feature.paths.map((p) => resolve(repoRoot, p))
    const files = await collectSourceFiles(absRoots)
    if (files.length === 0) return `classDiagram\n  class Empty`

    const lines: string[] = ['classDiagram']
    for (const file of files) {
        const src = await readSource(file)
        if (!src) continue
        const rel = relative(repoRoot, file)
        const baseName =
            rel
                .split(sep)
                .pop()
                ?.replace(/\.(ts|tsx|vue|mjs|js)$/, '') ?? rel
        const className = sanitizeId(baseName)

        const props: string[] = []
        // defineProps<...>() — 타입 본문이 너무 길면 잘라 표시
        const propsTypeMatch = src.match(/defineProps<\s*([\s\S]*?)\s*>\(/)
        const propsLitMatch = src.match(/defineProps\(\s*([\s\S]*?)\s*\)/)
        if (propsTypeMatch?.[1]) props.push(`+props: ${truncate(propsTypeMatch[1])}`)
        else if (propsLitMatch?.[1]) props.push(`+props: ${truncate(propsLitMatch[1])}`)

        const emitsTypeMatch = src.match(/defineEmits<\s*([\s\S]*?)\s*>\(/)
        const emitsLitMatch = src.match(/defineEmits\(\s*([\s\S]*?)\s*\)/)
        if (emitsTypeMatch?.[1]) props.push(`+emits: ${truncate(emitsTypeMatch[1])}`)
        else if (emitsLitMatch?.[1]) props.push(`+emits: ${truncate(emitsLitMatch[1])}`)

        // export const/function 시그니처
        const exportRe =
            /export\s+(?:default\s+)?(?:async\s+)?(const|function|class|interface)\s+(\w+)/g
        let m: RegExpExecArray | null
        const exports: string[] = []
        while ((m = exportRe.exec(src)) !== null) {
            if (m[1] && m[2]) exports.push(`+${m[1]} ${m[2]}`)
        }

        lines.push(`  class ${className} {`)
        for (const p of props) lines.push(`    ${p}`)
        for (const e of exports.slice(0, 12)) lines.push(`    ${e}`)
        lines.push('  }')
    }
    return lines.join('\n')
}

function truncate(s: string, max = 40): string {
    const compact = s.replace(/\s+/g, ' ').trim()
    return compact.length > max ? compact.slice(0, max - 1) + '…' : compact
}

export async function buildFrontendDiagram(feature: Feature, type: DiagramType): Promise<string> {
    if (type === 'class') return frontendClass(feature)
    return frontendFlowchart(feature)
}
