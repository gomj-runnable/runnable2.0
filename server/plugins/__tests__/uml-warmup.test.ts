import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.stubGlobal('defineNitroPlugin', (fn: unknown) => fn)

vi.mock('../../utils/uml/detect-features', () => ({
    getOrDetectFeatures: vi.fn()
}))

vi.mock('../../utils/uml/paths', () => ({
    repoRoot: '/fake/repo',
    featuresCachePath: '/fake/repo/.cache/uml/features.json'
}))

const { getOrDetectFeatures } = await import('../../utils/uml/detect-features')
const warmup = (await import('../uml-warmup')).default as () => Promise<void>

describe('uml-warmup plugin', () => {
    let logSpy: ReturnType<typeof vi.spyOn>
    let warnSpy: ReturnType<typeof vi.spyOn>
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        vi.mocked(getOrDetectFeatures).mockReset()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('features 가 검출되면 features=N + byDomain 로그를 남긴다', async () => {
        vi.mocked(getOrDetectFeatures).mockResolvedValueOnce({
            scannedAt: '2026-05-20T00:00:00Z',
            features: [
                {
                    id: 'a',
                    domain: 'frontend',
                    name: 'a',
                    paths: [],
                    fileCount: 1,
                    detectedAt: 'x'
                },
                {
                    id: 'b',
                    domain: 'frontend',
                    name: 'b',
                    paths: [],
                    fileCount: 1,
                    detectedAt: 'x'
                },
                { id: 'c', domain: 'backend', name: 'c', paths: [], fileCount: 1, detectedAt: 'x' }
            ]
        } as any)

        await warmup()

        expect(warnSpy).not.toHaveBeenCalled()
        expect(errorSpy).not.toHaveBeenCalled()
        expect(logSpy).toHaveBeenCalledTimes(1)
        const [msg, meta] = logSpy.mock.calls[0]
        expect(msg).toBe('[uml-warmup] features=3')
        expect(meta).toMatchObject({
            byDomain: { frontend: 2, backend: 1 },
            repoRoot: '/fake/repo',
            scannedAt: '2026-05-20T00:00:00Z'
        })
    })

    it('features 가 0건이면 warn 으로 진단 경로를 출력하고 log 는 호출하지 않는다', async () => {
        vi.mocked(getOrDetectFeatures).mockResolvedValueOnce({
            scannedAt: '2026-05-20T00:00:00Z',
            features: []
        } as any)

        await warmup()

        expect(logSpy).not.toHaveBeenCalled()
        expect(errorSpy).not.toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalledTimes(1)
        const [, meta] = warnSpy.mock.calls[0]
        expect(meta).toMatchObject({
            repoRoot: '/fake/repo',
            featuresCachePath: '/fake/repo/.cache/uml/features.json',
            scannedAt: '2026-05-20T00:00:00Z'
        })
    })

    it('detect 가 throw 해도 서버를 죽이지 않고 error 로그만 남긴다', async () => {
        vi.mocked(getOrDetectFeatures).mockRejectedValueOnce(new Error('boom'))

        await expect(warmup()).resolves.toBeUndefined()
        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).not.toHaveBeenCalled()
        expect(warnSpy).not.toHaveBeenCalled()
    })
})
