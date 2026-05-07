import { readdirSync, existsSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import type { DiagramJSON, DiagramNode, DiagramEdge } from '../../runtime/types'

const FSD_LAYERS = ['widgets', 'features', 'entities', 'shared'] as const

function getModuleDirs(root: string): Array<{ layer: string; moduleDir: string; absPath: string }> {
    const results: Array<{ layer: string; moduleDir: string; absPath: string }> = []
    for (const layer of FSD_LAYERS) {
        const layerPath = resolve(root, 'app', layer)
        if (!existsSync(layerPath)) continue
        const entries = readdirSync(layerPath, { withFileTypes: true })
        for (const entry of entries) {
            if (entry.isDirectory()) {
                results.push({
                    layer,
                    moduleDir: `${layer}/${entry.name}`,
                    absPath: resolve(layerPath, entry.name)
                })
            }
        }
    }
    return results
}

export async function analyzeFsd(root: string): Promise<DiagramJSON> {
    const modules = getModuleDirs(root)
    const nodes: DiagramNode[] = modules.map((m) => ({
        id: m.moduleDir,
        label: m.moduleDir,
        group: m.layer
    }))

    const moduleIds = new Set(modules.map((m) => m.moduleDir))
    const edges: DiagramEdge[] = []
    const edgeSet = new Set<string>()

    // ts-morph로 import 경로를 추출하기엔 Cesium 등으로 느려질 수 있으므로,
    // 정규식으로 import 문에서 경로만 빠르게 추출한다
    const { globSync } = await import('glob')
    const tsFiles = globSync('app/{widgets,features,entities,shared}/**/*.{ts,vue}', {
        cwd: root,
        absolute: true,
        ignore: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts']
    })

    for (const filePath of tsFiles) {
        const { readFileSync } = await import('node:fs')
        const content = readFileSync(filePath, 'utf-8')

        // 현재 파일이 속한 모듈 결정
        const relPath = relative(resolve(root, 'app'), filePath).replace(/\\/g, '/')
        let sourceModule: string | null = null
        for (const m of modules) {
            const relModule = relative(resolve(root, 'app'), m.absPath).replace(/\\/g, '/')
            if (relPath.startsWith(relModule + '/') || relPath === relModule) {
                sourceModule = m.moduleDir
                break
            }
        }
        if (!sourceModule) continue

        // import 경로에서 ~/entities/xxx, ~/features/xxx 등 추출
        const importRe = /from\s+['"]([^'"]+)['"]/g
        let match: RegExpExecArray | null
        while ((match = importRe.exec(content)) !== null) {
            const importPath = match[1]!
            // ~/layer/module 형태 처리
            const tildeMatch = importPath.match(/^~\/(widgets|features|entities|shared)\/([^/]+)/)
            if (tildeMatch) {
                const targetModule = `${tildeMatch[1]}/${tildeMatch[2]}`
                if (
                    moduleIds.has(targetModule) &&
                    targetModule !== sourceModule &&
                    // 같은 레이어 내부 import는 제외
                    tildeMatch[1] !== sourceModule.split('/')[0]
                ) {
                    const edgeId = `${sourceModule}->${targetModule}`
                    if (!edgeSet.has(edgeId)) {
                        edgeSet.add(edgeId)
                        edges.push({
                            id: edgeId,
                            source: sourceModule,
                            target: targetModule,
                            kind: 'imports'
                        })
                    }
                }
            }
        }
    }

    return {
        kind: 'fsd',
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
