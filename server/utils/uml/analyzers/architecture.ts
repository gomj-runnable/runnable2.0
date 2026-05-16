import { promises as fs } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import type { DiagramType, Feature } from '~~/shared/types/uml'
import { repoRoot } from '../paths'
import { collectSourceFiles, sanitizeId, escapeMermaidLabel } from './common'

interface PackageJson {
    name?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}

async function readPkg(): Promise<PackageJson> {
    const raw = await fs.readFile(resolve(repoRoot, 'package.json'), 'utf-8')
    return JSON.parse(raw) as PackageJson
}

export async function architectureFlowchart(feature: Feature): Promise<string> {
    const lines: string[] = ['flowchart TD']
    const root = sanitizeId(feature.id)
    lines.push(`  ${root}["${escapeMermaidLabel(feature.name)}"]`)
    const absRoots = feature.paths.map((p) => resolve(repoRoot, p))
    const files = await collectSourceFiles(absRoots)
    const grouped = new Map<string, number>()
    for (const file of files) {
        const rel = relative(repoRoot, file)
        const parts = rel.split(sep)
        // 가장 가까운 2단계 디렉터리로 그룹화
        const key = parts.slice(0, Math.min(3, parts.length - 1)).join('/') || rel
        grouped.set(key, (grouped.get(key) ?? 0) + 1)
    }
    const entries = Array.from(grouped.entries()).slice(0, 40)
    for (const [key, count] of entries) {
        const id = sanitizeId(key)
        lines.push(`  ${id}["${escapeMermaidLabel(key)} (${count})"]`)
        lines.push(`  ${root} --> ${id}`)
    }
    if (entries.length === 0) lines.push(`  ${root} -.-> empty["(no files)"]`)
    return lines.join('\n')
}

export async function architectureDependency(feature: Feature): Promise<string> {
    const pkg = await readPkg()
    const isDev = feature.id === 'library:dev-tools'
    const map = (isDev ? pkg.devDependencies : pkg.dependencies) ?? {}
    const lines: string[] = ['flowchart LR']
    const rootId = sanitizeId(pkg.name ?? 'app')
    lines.push(`  ${rootId}["${escapeMermaidLabel(pkg.name ?? 'app')}"]`)
    const entries = Object.entries(map).slice(0, 60)
    for (const [name, version] of entries) {
        const id = sanitizeId(name)
        lines.push(`  ${id}["${escapeMermaidLabel(`${name}@${version}`)}"]`)
        lines.push(`  ${rootId} --> ${id}`)
    }
    if (entries.length === 0) lines.push(`  ${rootId} -.-> empty["(no deps)"]`)
    return lines.join('\n')
}

export async function buildArchitectureDiagram(
    feature: Feature,
    type: DiagramType
): Promise<string> {
    if (type === 'dependency') return architectureDependency(feature)
    return architectureFlowchart(feature)
}
