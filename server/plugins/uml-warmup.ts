import { getOrDetectFeatures } from '../utils/uml/detect-features'
import { featuresCachePath, repoRoot } from '../utils/uml/paths'

export default defineNitroPlugin(async () => {
    try {
        const { features, scannedAt } = await getOrDetectFeatures()
        const byDomain = features.reduce<Record<string, number>>((acc, f) => {
            acc[f.domain] = (acc[f.domain] ?? 0) + 1
            return acc
        }, {})

        if (features.length === 0) {
            console.warn(
                '[uml-warmup] detect 결과가 0건입니다. repoRoot 또는 캐시 경로 확인 필요.',
                {
                    repoRoot,
                    featuresCachePath,
                    scannedAt
                }
            )
            return
        }

        console.log(`[uml-warmup] features=${features.length}`, { byDomain, repoRoot, scannedAt })
    } catch (e) {
        console.error('[uml-warmup] 실패:', e)
    }
})
