import { describe, it, expect, vi, beforeEach } from 'vitest'

import { backendClass, backendSequence, buildBackendDiagram } from '../backend'
import type { Feature } from '~~/shared/types/uml'

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

const f: Feature = {
    id: 'backend:routes',
    domain: 'backend' as any,
    name: 'Routes',
    paths: ['server/api/routes'],
    fileCount: 0,
    detectedAt: '2026-05-15T00:00:00Z'
}

describe('backendClass()', () => {
    beforeEach(() => {
        fsReadFile.mockReset()
        collectSourceFiles.mockReset()
    })

    it('files 0 → "class Empty"', async () => {
        collectSourceFiles.mockResolvedValue([])
        const mmd = await backendClass(f)
        expect(mmd).toContain('classDiagram')
        expect(mmd).toContain('class Empty')
    })

    it('export default defineEventHandler → +eventHandler()', async () => {
        collectSourceFiles.mockResolvedValue([`${process.cwd()}/server/api/routes/get.ts`])
        fsReadFile.mockResolvedValue('export default defineEventHandler(async () => {})')
        const mmd = await backendClass(f)
        expect(mmd).toContain('+eventHandler()')
        expect(mmd).toContain('class get')
    })

    it('export const/function/class/interface 추출', async () => {
        collectSourceFiles.mockResolvedValue([`${process.cwd()}/server/services/a.ts`])
        fsReadFile.mockResolvedValue(`
export const fn1 = () => {}
export function fn2() {}
export class C1 {}
export interface I1 {}
`)
        const mmd = await backendClass(f)
        expect(mmd).toContain('+fn1()')
        expect(mmd).toContain('+fn2()')
        expect(mmd).toContain('+C1()')
        expect(mmd).toContain('+I1()')
    })

    it('동일 이름 중복 제거 + 12개 초과 시 break', async () => {
        collectSourceFiles.mockResolvedValue([`${process.cwd()}/server/services/a.ts`])
        const exports = Array.from({ length: 20 }, (_, i) => `export const fn${i} = () => {}`)
        fsReadFile.mockResolvedValue(exports.join('\n'))
        const mmd = await backendClass(f)
        // seen.size > 12 이면 break → 정확히 13개 까지 출력 (`if (seen.size > 12) break;` 는 13번째 후 종료)
        const count = (mmd.match(/\+fn\d+\(\)/g) ?? []).length
        expect(count).toBeLessThanOrEqual(13)
    })
})

describe('backendSequence()', () => {
    beforeEach(() => {
        fsReadFile.mockReset()
        collectSourceFiles.mockReset()
    })

    it('files 0 → "no source" placeholder', async () => {
        collectSourceFiles.mockResolvedValue([])
        const mmd = await backendSequence(f)
        expect(mmd).toContain('sequenceDiagram')
        expect(mmd).toContain('no source')
    })

    it('api 디렉터리의 파일만 처리, services/repositories/utils import 만 participant 추가', async () => {
        collectSourceFiles.mockResolvedValue([`${process.cwd()}/server/api/routes/get.ts`])
        fsReadFile.mockResolvedValue(`
import { routeService } from '../../services/route.service'
import { x } from '../../repositories/route.repository'
import { y } from '../../utils/auth'
import { z } from 'lodash'
`)
        const mmd = await backendSequence(f)
        expect(mmd).toContain('sequenceDiagram')
        expect(mmd).toContain('Client->>')
        expect(mmd).toContain('route_service')
        expect(mmd).toContain('route_repository')
        expect(mmd).toContain('auth')
        expect(mmd).not.toContain('lodash')
    })

    it('non-api 파일은 스킵', async () => {
        collectSourceFiles.mockResolvedValue([`${process.cwd()}/server/utils/x.ts`])
        fsReadFile.mockResolvedValue(`import { y } from './y'`)
        const mmd = await backendSequence(f)
        // api 가 아니면 그냥 헤더만 있고 Client->> 없음
        expect(mmd).not.toContain('Client->>')
    })
})

describe('buildBackendDiagram()', () => {
    beforeEach(() => {
        collectSourceFiles.mockReset()
    })

    it('type=sequence → backendSequence', async () => {
        collectSourceFiles.mockResolvedValue([])
        const mmd = await buildBackendDiagram(f, 'sequence')
        expect(mmd).toContain('sequenceDiagram')
    })

    it('그 외 → backendClass', async () => {
        collectSourceFiles.mockResolvedValue([])
        const mmd = await buildBackendDiagram(f, 'class')
        expect(mmd).toContain('classDiagram')
    })
})
