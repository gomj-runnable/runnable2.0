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
    if (files.length === 0) return `classDiagram\n  direction TB\n  class Empty`

    // direction TB: 카드 가로폭이 좁아도 vertical stack 으로 박스가 squash 되지 않음 (#257)
    const lines: string[] = ['classDiagram', '  direction TB']
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
        // defineProps<{ key: type, ... }>() — 각 key 를 클래스 멤버로 분해
        const propsTypeMatch = src.match(/defineProps<\s*\{([\s\S]*?)\}\s*>\(/)
        if (propsTypeMatch?.[1]) {
            for (const { name, type } of extractTypeMembers(propsTypeMatch[1]).slice(0, 12)) {
                props.push(`+${name}: ${truncate(type, 30)}`)
            }
        } else {
            const propsLitMatch = src.match(/defineProps\(\s*([\s\S]*?)\s*\)/)
            if (propsLitMatch?.[1]) props.push(`+props: ${truncate(propsLitMatch[1])}`)
        }

        // defineEmits<{ event: [payload] }>() — 각 event 를 멤버로 분해
        const emitsTypeMatch = src.match(/defineEmits<\s*\{([\s\S]*?)\}\s*>\(/)
        if (emitsTypeMatch?.[1]) {
            for (const { name, type } of extractTypeMembers(emitsTypeMatch[1]).slice(0, 8)) {
                props.push(`+@${name}: ${truncate(type, 30)}`)
            }
        } else {
            const emitsLitMatch = src.match(/defineEmits\(\s*([\s\S]*?)\s*\)/)
            if (emitsLitMatch?.[1]) props.push(`+emits: ${truncate(emitsLitMatch[1])}`)
        }

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

// `{ key: type, key2: type2 }` 본문에서 멤버 추출 (JSdoc/줄바꿈/중첩 generic 일부 처리).
// 정규식 기반이라 깊은 중첩은 보수적으로 잘라낸다 — 단조로운 한 줄보다 분해된 표시가 목적.
function extractTypeMembers(body: string): Array<{ name: string; type: string }> {
    // Vue defineProps 는 보통 newline 으로 멤버 구분 (`,` 없음) — newline 도 separator.
    const cleaned = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    const members: Array<{ name: string; type: string }> = []
    // 같은 depth 의 토큰 단위로 split: { ... } / [ ... ] / ( ... ) / <...> 안의 separator 는 무시
    let depth = 0
    let buf = ''
    const parts: string[] = []
    for (const ch of cleaned) {
        if (ch === '{' || ch === '[' || ch === '(' || ch === '<') depth++
        else if (ch === '}' || ch === ']' || ch === ')' || ch === '>') depth--
        if (depth === 0 && (ch === ',' || ch === ';' || ch === '\n')) {
            if (buf.trim()) parts.push(buf.trim())
            buf = ''
        } else buf += ch
    }
    if (buf.trim()) parts.push(buf.trim())
    for (const part of parts) {
        const m = part.match(/^(\w+)\??\s*:\s*([\s\S]+)$/)
        if (m?.[1] && m[2]) members.push({ name: m[1], type: m[2].trim() })
    }
    return members
}

// mermaid classDiagram member 라인 안전화.
// `{`, `}`, JSdoc 블록 주석, `…` 등이 들어가면 v11 파서가 통째로 깨진다.
function truncate(s: string, max = 40): string {
    const compact = s
        .replace(/\/\*[\s\S]*?\*\//g, '') // 블록 주석 제거 (JSdoc 포함)
        .replace(/\/\/.*$/gm, '') // 라인 주석 제거
        .replace(/[\n\r]+/g, ' ') // 줄바꿈 → 공백
        .replace(/<([^<>]+)>/g, '~$1~') // generic `Set<T>` → mermaid 문법 `Set~T~`
        .replace(/[{}"'`]/g, '') // 그 외 mermaid 구문 충돌 문자 제거
        .replace(/\s+/g, ' ')
        .trim()
    return compact.length > max ? compact.slice(0, max - 1) + '...' : compact
}

export async function buildFrontendDiagram(feature: Feature, type: DiagramType): Promise<string> {
    if (type === 'class') return frontendClass(feature)
    return frontendFlowchart(feature)
}
