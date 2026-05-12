import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DiagramJSON } from '../runtime/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../../../')
const inDir = resolve(root, 'public/diagrams')
const outDir = resolve(root, 'docs/diagrams')

const BANNER = '<!-- AUTO-GENERATED — do not edit by hand. Run: pnpm gen:mermaid -->'

function readJson(name: string): DiagramJSON {
    return JSON.parse(readFileSync(resolve(inDir, `${name}.json`), 'utf-8')) as DiagramJSON
}

function writeMmd(name: string, content: string): void {
    mkdirSync(outDir, { recursive: true })
    writeFileSync(resolve(outDir, `${name}.mmd`), content, 'utf-8')
}

function writeMd(name: string, mmd: string, title: string): void {
    const md = `${BANNER}\n# ${title}\n\n\`\`\`mermaid\n${mmd}\`\`\`\n`
    writeFileSync(resolve(outDir, `${name}.md`), md, 'utf-8')
}

export function convertFsd(): string {
    const data = readJson('fsd')
    // Groups map to subgraphs: widgets, features, entities, shared
    const groups: Record<string, string[]> = {}
    for (const node of data.nodes) {
        const g = node.group ?? 'other'
        ;(groups[g] ??= []).push(node.id)
    }
    const lines: string[] = ['graph TD']
    for (const [group, ids] of Object.entries(groups)) {
        lines.push(`    subgraph ${group}`)
        for (const id of ids) {
            const safe = id.replace(/\//g, '_').replace(/-/g, '_')
            lines.push(`        ${safe}["${id}"]`)
        }
        lines.push('    end')
    }
    for (const edge of data.edges) {
        const src = edge.source.replace(/\//g, '_').replace(/-/g, '_')
        const tgt = edge.target.replace(/\//g, '_').replace(/-/g, '_')
        lines.push(`    ${src} --> ${tgt}`)
    }
    return lines.join('\n') + '\n'
}

export function convertUserJourney(): string {
    const data = readJson('user-journey')
    const lines: string[] = ['journey', '    title 러닝 경로 서비스 유저 저니', '    section 메인 플로우']
    for (const node of data.nodes) {
        lines.push(`        ${node.label}: 5: User`)
    }
    return lines.join('\n') + '\n'
}

export function convertComposables(): string {
    const data = readJson('composables')
    // Group nodes by kind for subgraphs
    const kinds: Record<string, string[]> = {}
    for (const node of data.nodes) {
        const k = node.kind ?? 'other'
        ;(kinds[k] ??= []).push(node.id)
    }
    const lines: string[] = ['graph LR']
    for (const [kind, ids] of Object.entries(kinds)) {
        lines.push(`    subgraph ${kind}`)
        for (const id of ids) {
            lines.push(`        ${id}`)
        }
        lines.push('    end')
    }
    for (const edge of data.edges) {
        lines.push(`    ${edge.source} --> ${edge.target}`)
    }
    return lines.join('\n') + '\n'
}

export function convertClasses(): string {
    const data = readJson('classes')
    // Split into subgraphs by group: types, schemas, services
    const groups: Record<string, string[]> = {}
    for (const node of data.nodes) {
        const g = node.group ?? 'other'
        ;(groups[g] ??= []).push(node.id)
    }
    const lines: string[] = ['graph TD']
    for (const [group, ids] of Object.entries(groups)) {
        lines.push(`    subgraph ${group}`)
        for (const id of ids) {
            const safe = id.replace(/-/g, '_').replace(/\./g, '_')
            lines.push(`        ${safe}["${id}"]`)
        }
        lines.push('    end')
    }
    for (const edge of data.edges) {
        const src = edge.source.replace(/-/g, '_').replace(/\./g, '_')
        const tgt = edge.target.replace(/-/g, '_').replace(/\./g, '_')
        const label = edge.kind === 'extends' ? '|extends|' : ''
        lines.push(`    ${src} -->${label} ${tgt}`)
    }
    return lines.join('\n') + '\n'
}

async function main() {
    const tasks: Array<{ name: string; title: string; convert: () => string }> = [
        { name: 'fsd', title: 'FSD 레이어 그래프', convert: convertFsd },
        { name: 'user-journey', title: '유저 저니', convert: convertUserJourney },
        { name: 'composables', title: 'Composable 의존 관계', convert: convertComposables },
        { name: 'classes', title: '클래스/타입 다이어그램', convert: convertClasses },
    ]

    for (const task of tasks) {
        const mmd = task.convert()
        writeMmd(task.name, mmd)
        writeMd(task.name, mmd, task.title)
        console.log(`[gen-mermaid] ${task.name}.mmd written`)
    }
}

const isDirectInvocation = (() => {
    if (!process.argv[1]) return false
    try {
        return fileURLToPath(import.meta.url) === resolve(process.argv[1])
    } catch {
        return false
    }
})()

if (isDirectInvocation) {
    main().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}
