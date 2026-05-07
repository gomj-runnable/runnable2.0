import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import type { DiagramJSON, DiagramNode, DiagramEdge } from '../../runtime/types'

interface NodeEntry {
    id: string
    label: string
    group: 'types' | 'schemas' | 'services'
    data: Record<string, unknown>
}

function extractTypeNodes(content: string, filePath: string): NodeEntry[] {
    const nodes: NodeEntry[] = []
    // interface Foo { ... } 또는 type Foo = ...
    const interfaceRe = /export\s+(?:interface|type)\s+([A-Z][A-Za-z0-9]*)/g
    let m: RegExpExecArray | null
    while ((m = interfaceRe.exec(content)) !== null) {
        nodes.push({ id: m[1]!, label: m[1]!, group: 'types', data: { file: filePath } })
    }
    return nodes
}

function extractSchemaNodes(content: string, filePath: string): NodeEntry[] {
    const nodes: NodeEntry[] = []
    // export const fooSchema = z.object(...) 또는 export const fooSchema = z.xxx
    const schemaRe = /export\s+const\s+([a-zA-Z][A-Za-z0-9]*Schema)\s*=/g
    let m: RegExpExecArray | null
    while ((m = schemaRe.exec(content)) !== null) {
        nodes.push({ id: m[1]!, label: m[1]!, group: 'schemas', data: { file: filePath } })
    }
    return nodes
}

function extractServiceNodes(content: string, filePath: string): NodeEntry[] {
    const nodes: NodeEntry[] = []
    // export interface IXxxRepository
    const repoRe = /export\s+interface\s+(I[A-Z][A-Za-z0-9]*(?:Repository|Service|Handler))/g
    let m: RegExpExecArray | null
    while ((m = repoRe.exec(content)) !== null) {
        nodes.push({ id: m[1]!, label: m[1]!, group: 'services', data: { file: filePath } })
    }
    // API handler 파일: defineEventHandler 사용 → 파일명을 노드로
    if (content.includes('defineEventHandler')) {
        const name = filePath
            .split('/')
            .pop()!
            .replace(/\.(ts|js)$/, '')
            .replace(/[.[\]]/g, '_')
        const id = `api__${name}`
        nodes.push({
            id,
            label: name,
            group: 'services',
            data: { file: filePath, kind: 'handler' }
        })
    }
    return nodes
}

function extractTypeEdges(
    content: string,
    nodeIds: Set<string>
): Array<{ source: string; target: string; kind: 'extends' | 'uses' }> {
    const edges: Array<{ source: string; target: string; kind: 'extends' | 'uses' }> = []

    // interface Foo extends Bar, Baz
    const extendsRe = /interface\s+(\w+)\s+extends\s+([^{]+)/g
    let m: RegExpExecArray | null
    while ((m = extendsRe.exec(content)) !== null) {
        const source = m[1]!
        if (!nodeIds.has(source)) continue
        const targets = m[2]!.split(',').map((s) => s.trim().replace(/<.*>/, ''))
        for (const target of targets) {
            if (nodeIds.has(target)) {
                edges.push({ source, target, kind: 'extends' })
            }
        }
    }

    // type Foo = Bar & ... (intersection)
    const typeAliasRe = /type\s+(\w+)\s+=\s+([^;]+)/g
    while ((m = typeAliasRe.exec(content)) !== null) {
        const source = m[1]!
        if (!nodeIds.has(source)) continue
        const rhs = m[2]!
        for (const id of nodeIds) {
            if (id !== source && rhs.includes(id)) {
                edges.push({ source, target: id, kind: 'uses' })
            }
        }
    }

    return edges
}

function extractSchemaEdges(
    content: string,
    nodeIds: Set<string>
): Array<{ source: string; target: string; kind: 'uses' }> {
    const edges: Array<{ source: string; target: string; kind: 'uses' }> = []

    // const fooSchema = z.object({ ..., bar: barSchema, ... })
    const schemaNames = [...nodeIds].filter((id) => id.endsWith('Schema'))

    for (const srcSchema of schemaNames) {
        // 해당 schema 정의 블록에서 다른 schema 참조 찾기
        const re = new RegExp(`const\\s+${srcSchema}\\s*=([^;]{0,600})`, 's')
        const blockMatch = content.match(re)
        if (!blockMatch) continue
        const block = blockMatch[1]!
        for (const targetSchema of schemaNames) {
            if (targetSchema !== srcSchema && block.includes(targetSchema)) {
                edges.push({ source: srcSchema, target: targetSchema, kind: 'uses' })
            }
        }
    }

    return edges
}

export async function analyzeClasses(root: string): Promise<DiagramJSON> {
    const { globSync } = await import('glob')

    const typeFiles = globSync('shared/types/**/*.ts', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/*.test.ts']
    })
    const schemaFiles = globSync('shared/schemas/**/*.ts', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/*.test.ts']
    })
    const repoFiles = globSync('server/repositories/**/*.ts', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/*.test.ts']
    })
    const apiFiles = globSync('server/api/**/*.ts', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/*.test.ts']
    })

    const allNodes: NodeEntry[] = []
    const fileContents = new Map<string, string>()

    for (const filePath of typeFiles) {
        const content = readFileSync(filePath, 'utf-8')
        const rel = relative(root, filePath).replace(/\\/g, '/')
        fileContents.set(rel, content)
        allNodes.push(...extractTypeNodes(content, rel))
    }
    for (const filePath of schemaFiles) {
        const content = readFileSync(filePath, 'utf-8')
        const rel = relative(root, filePath).replace(/\\/g, '/')
        fileContents.set(rel, content)
        allNodes.push(...extractSchemaNodes(content, rel))
    }
    for (const filePath of repoFiles) {
        const content = readFileSync(filePath, 'utf-8')
        const rel = relative(root, filePath).replace(/\\/g, '/')
        fileContents.set(rel, content)
        allNodes.push(...extractServiceNodes(content, rel))
    }
    for (const filePath of apiFiles) {
        const content = readFileSync(filePath, 'utf-8')
        const rel = relative(root, filePath).replace(/\\/g, '/')
        fileContents.set(rel, content)
        allNodes.push(...extractServiceNodes(content, rel))
    }

    // 중복 ID 제거
    const nodeMap = new Map<string, NodeEntry>()
    for (const n of allNodes) {
        if (!nodeMap.has(n.id)) nodeMap.set(n.id, n)
    }

    const nodes: DiagramNode[] = [...nodeMap.values()].map((n) => ({
        id: n.id,
        label: n.label,
        group: n.group,
        data: n.data
    }))

    const nodeIds = new Set(nodeMap.keys())
    const edges: DiagramEdge[] = []
    const edgeSet = new Set<string>()

    for (const [, content] of fileContents) {
        const typeEdges = extractTypeEdges(content, nodeIds)
        const schemaEdges = extractSchemaEdges(content, nodeIds)

        for (const e of [...typeEdges, ...schemaEdges]) {
            const edgeId = `${e.source}->${e.target}__${e.kind}`
            if (!edgeSet.has(edgeId)) {
                edgeSet.add(edgeId)
                edges.push({
                    id: edgeId,
                    source: e.source,
                    target: e.target,
                    kind: e.kind
                })
            }
        }
    }

    return {
        kind: 'classes',
        nodes,
        edges,
        meta: {
            generatedAt: new Date().toISOString(),
            sourceCommit: '',
            nodeCount: nodes.length,
            edgeCount: edges.length
        }
    }
}
