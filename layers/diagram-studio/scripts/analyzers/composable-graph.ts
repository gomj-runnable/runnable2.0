import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import type { DiagramJSON, DiagramNode, DiagramEdge } from '../../runtime/types'

function inferKind(filePath: string): string {
    if (filePath.includes('/model/') && filePath.match(/Facade/i)) return 'facade'
    if (filePath.includes('/model/') && filePath.match(/Store/i)) return 'store'
    if (filePath.includes('/api/') && filePath.match(/Sideeffect/i)) return 'sideeffect'
    if (filePath.includes('/model/')) return 'store'
    if (filePath.includes('/api/')) return 'sideeffect'
    if (filePath.includes('/lib/')) return 'lib'
    return 'composable'
}

function extractComposableName(content: string): string[] {
    // export const useXxx = ... 또는 export function useXxx
    const names: string[] = []
    const re = /export\s+(?:const|function|async function)\s+(use[A-Z][A-Za-z0-9]*)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
        names.push(m[1]!)
    }
    return names
}

function extractCalledComposables(content: string): string[] {
    // 함수 본문에서 useXxx() 호출 추출 (export 선언 제외)
    const called: string[] = []
    const re = /(?<!export\s+(?:const|function|async function)\s)(use[A-Z][A-Za-z0-9]*)\s*[(<]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
        called.push(m[1]!)
    }
    return [...new Set(called)]
}

export async function analyzeComposables(root: string): Promise<DiagramJSON> {
    const { globSync } = await import('glob')

    // .ts 파일 + .vue 파일 포함 (script setup에서도 composable 정의 가능)
    const tsFiles = globSync('app/**/*.ts', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
    })
    const vueFiles = globSync('app/**/*.vue', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/node_modules/**']
    })

    // composableName -> { filePath, content }
    const composableMap = new Map<string, { filePath: string; content: string }>()

    for (const filePath of tsFiles) {
        const content = readFileSync(filePath, 'utf-8')
        const names = extractComposableName(content)
        for (const name of names) {
            composableMap.set(name, { filePath, content })
        }
    }

    for (const filePath of vueFiles) {
        const content = readFileSync(filePath, 'utf-8')
        // script setup 블록 추출
        const scriptMatch = content.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/)
        if (!scriptMatch) continue
        const scriptContent = scriptMatch[1]!
        const names = extractComposableName(scriptContent)
        for (const name of names) {
            composableMap.set(name, { filePath, content: scriptContent })
        }
    }

    const nodes: DiagramNode[] = []
    const edges: DiagramEdge[] = []
    const edgeSet = new Set<string>()

    for (const [name, { filePath }] of composableMap) {
        const relPath = relative(root, filePath).replace(/\\/g, '/')
        nodes.push({
            id: name,
            label: name,
            kind: inferKind(relPath),
            data: { file: relPath }
        })
    }

    const allNames = new Set(composableMap.keys())

    for (const [name, { content }] of composableMap) {
        const called = extractCalledComposables(content)
        for (const callee of called) {
            if (callee === name) continue
            if (!allNames.has(callee)) continue
            const edgeId = `${name}->${callee}`
            if (!edgeSet.has(edgeId)) {
                edgeSet.add(edgeId)
                edges.push({
                    id: edgeId,
                    source: name,
                    target: callee,
                    kind: 'calls'
                })
            }
        }
    }

    return {
        kind: 'composables',
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
