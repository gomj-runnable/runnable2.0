import { promises as fs } from 'node:fs'
import { basename, relative, resolve, sep } from 'node:path'
import type { DiagramType, Feature } from '~~/shared/types/uml'
import { repoRoot } from '../paths'
import {
    collectSourceFiles,
    extractImportSpecifiers,
    sanitizeId,
    escapeMermaidLabel
} from './common'

export async function backendClass(feature: Feature): Promise<string> {
    const absRoots = feature.paths.map((p) => resolve(repoRoot, p))
    const files = await collectSourceFiles(absRoots)
    if (files.length === 0) return `classDiagram\n  direction TB\n  class Empty`

    // direction TB: 카드 가로폭이 좁아도 vertical stack — squash 방지 (#257)
    const lines: string[] = ['classDiagram', '  direction TB']
    for (const file of files) {
        const src = await fs.readFile(file, 'utf-8')
        const rel = relative(repoRoot, file)
        const fileLabel =
            rel
                .split(sep)
                .pop()
                ?.replace(/\.(ts|tsx)$/, '') ?? rel
        const className = sanitizeId(fileLabel)
        lines.push(`  class ${className} {`)

        const handlerMatch = src.match(/export\s+default\s+(?:async\s+)?defineEventHandler/)
        if (handlerMatch) lines.push(`    +eventHandler()`)

        const exportRe =
            /export\s+(?:default\s+)?(?:async\s+)?(?:const|function|class|interface)\s+(\w+)/g
        let m: RegExpExecArray | null
        const seen = new Set<string>()
        while ((m = exportRe.exec(src)) !== null) {
            const name = m[1]
            if (!name || seen.has(name)) continue
            seen.add(name)
            lines.push(`    +${name}()`)
            if (seen.size > 12) break
        }
        lines.push('  }')
    }
    return lines.join('\n')
}

export async function backendSequence(feature: Feature): Promise<string> {
    const absRoots = feature.paths.map((p) => resolve(repoRoot, p))
    const files = await collectSourceFiles(absRoots)
    if (files.length === 0) return `sequenceDiagram\n  Note over A,B: (no source)`

    const lines: string[] = ['sequenceDiagram', '  autonumber']
    const participants = new Set<string>(['Client'])
    for (const file of files) {
        const rel = relative(repoRoot, file)
        const isApi = rel.includes(`api${sep}`) || rel.startsWith(`server${sep}api`)
        if (!isApi) continue
        const handlerId = sanitizeId(basename(rel).replace(/\..*$/, ''))
        if (!participants.has(handlerId)) {
            lines.push(`  participant ${handlerId} as ${escapeMermaidLabel(rel)}`)
            participants.add(handlerId)
        }
        const src = await fs.readFile(file, 'utf-8')
        lines.push(`  Client->>${handlerId}: HTTP`)
        const specs = extractImportSpecifiers(src)
        for (const spec of specs) {
            if (
                !spec.includes('services') &&
                !spec.includes('repositories') &&
                !spec.includes('utils')
            )
                continue
            const tail = spec.split('/').pop() ?? spec
            const partId = sanitizeId(tail)
            if (!participants.has(partId)) {
                lines.push(`  participant ${partId} as ${escapeMermaidLabel(tail)}`)
                participants.add(partId)
            }
            lines.push(`  ${handlerId}->>${partId}: call`)
            lines.push(`  ${partId}-->>${handlerId}: result`)
        }
        lines.push(`  ${handlerId}-->>Client: 200`)
    }
    return lines.join('\n')
}

export async function buildBackendDiagram(feature: Feature, type: DiagramType): Promise<string> {
    if (type === 'sequence') return backendSequence(feature)
    return backendClass(feature)
}
