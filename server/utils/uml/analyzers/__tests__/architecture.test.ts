import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
    architectureFlowchart,
    architectureDependency,
    buildArchitectureDiagram
} from '../architecture'
import type { Feature } from '~~/shared/types/uml'

// repoRoot 를 process.cwd() 로 사용하므로 별도 mock 불필요.
// fs.readFile / collectSourceFiles 만 mock 하면 단위 테스트 가능.

const fsReadFile = vi.hoisted(() => vi.fn())
vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>()
    return {
        ...actual,
        promises: { ...actual.promises, readFile: fsReadFile }
    }
})

const collectSourceFiles = vi.hoisted(() => vi.fn())
vi.mock('../common', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../common')>()),
    collectSourceFiles
}))

const sampleFeature = (overrides: Partial<Feature> = {}): Feature => ({
    id: 'frontend:auth',
    domain: 'frontend' as any,
    name: '인증',
    paths: ['app/entities/user'],
    fileCount: 3,
    detectedAt: '2026-05-15T00:00:00Z',
    ...overrides
})

describe('architectureFlowchart()', () => {
    beforeEach(() => {
        collectSourceFiles.mockReset()
    })

    it('파일 0개 — "no files" empty 노드 추가', async () => {
        collectSourceFiles.mockResolvedValue([])
        const mmd = await architectureFlowchart(sampleFeature())
        expect(mmd).toContain('flowchart TD')
        expect(mmd).toContain('frontend_auth')
        expect(mmd).toContain('no files')
    })

    it('파일들을 디렉터리로 그룹화하고 count 표시', async () => {
        const cwd = process.cwd()
        collectSourceFiles.mockResolvedValue([
            `${cwd}/app/entities/user/model/a.ts`,
            `${cwd}/app/entities/user/model/b.ts`,
            `${cwd}/app/entities/user/api/c.ts`
        ])
        const mmd = await architectureFlowchart(sampleFeature())
        // 그룹화 key 는 path.slice(0, 3).join('/') — app/entities/user
        expect(mmd).toContain('app/entities/user')
        expect(mmd).toContain('(3)') // 같은 그룹키로 묶임
    })

    it('40개 초과 entry 는 잘림', async () => {
        const cwd = process.cwd()
        const files: string[] = []
        for (let i = 0; i < 60; i++) {
            files.push(`${cwd}/app/entities/${`dir${i}`}/x/a.ts`)
        }
        collectSourceFiles.mockResolvedValue(files)
        const mmd = await architectureFlowchart(sampleFeature())
        const edgeCount = (mmd.match(/-->/g) ?? []).length
        expect(edgeCount).toBe(40)
    })
})

describe('architectureDependency()', () => {
    beforeEach(() => {
        fsReadFile.mockReset()
    })

    it('feature.id != library:dev-tools — dependencies 사용', async () => {
        fsReadFile.mockResolvedValue(
            JSON.stringify({
                name: 'my-app',
                dependencies: { vue: '^3.0.0', nuxt: '^4.0.0' },
                devDependencies: { vitest: '^4.0.0' }
            })
        )
        const mmd = await architectureDependency(sampleFeature())
        expect(mmd).toContain('my-app')
        expect(mmd).toContain('vue@^3.0.0')
        expect(mmd).toContain('nuxt@^4.0.0')
        expect(mmd).not.toContain('vitest')
    })

    it('feature.id == library:dev-tools — devDependencies 사용', async () => {
        fsReadFile.mockResolvedValue(
            JSON.stringify({
                name: 'my-app',
                dependencies: { vue: '^3.0.0' },
                devDependencies: { vitest: '^4.0.0' }
            })
        )
        const mmd = await architectureDependency(sampleFeature({ id: 'library:dev-tools' }))
        expect(mmd).toContain('vitest@^4.0.0')
        expect(mmd).not.toContain('vue@')
    })

    it('빈 deps — "no deps" empty 노드', async () => {
        fsReadFile.mockResolvedValue(JSON.stringify({ name: 'x' }))
        const mmd = await architectureDependency(sampleFeature())
        expect(mmd).toContain('no deps')
    })

    it('name 누락 시 "app" fallback', async () => {
        fsReadFile.mockResolvedValue(JSON.stringify({ dependencies: { vue: '1' } }))
        const mmd = await architectureDependency(sampleFeature())
        expect(mmd).toMatch(/app/)
    })
})

describe('buildArchitectureDiagram()', () => {
    beforeEach(() => {
        fsReadFile.mockReset()
        collectSourceFiles.mockReset()
    })

    it('type=dependency → architectureDependency 호출', async () => {
        fsReadFile.mockResolvedValue(JSON.stringify({ name: 'app', dependencies: {} }))
        const mmd = await buildArchitectureDiagram(sampleFeature(), 'dependency')
        expect(mmd).toContain('flowchart LR')
    })

    it('그 외 type → architectureFlowchart 호출', async () => {
        collectSourceFiles.mockResolvedValue([])
        const mmd = await buildArchitectureDiagram(sampleFeature(), 'flowchart')
        expect(mmd).toContain('flowchart TD')
    })
})
