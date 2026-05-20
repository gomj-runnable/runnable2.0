// prod 컨테이너에는 .output / lib 만 복사되어 app/, server/ 원본 트리가 없다.
// 호스트 빌드 시점에 features.json 을 미리 생성해 두면, 컨테이너에서
// .omc/uml-cache/features.json 만 읽어서 /admin/uml 사이드바를 채울 수 있다.
import { promises as fs } from 'node:fs'
import { dirname, relative } from 'node:path'
import { detectAllFeatures } from '../server/utils/uml/detect-features'
import { featuresCachePath, repoRoot } from '../server/utils/uml/paths'

const payload = await detectAllFeatures()

if (payload.features.length === 0) {
    console.error('[build-uml-cache] detect 결과가 0건입니다. 캐시를 작성하지 않습니다.')
    process.exit(1)
}

await fs.mkdir(dirname(featuresCachePath), { recursive: true })
await fs.writeFile(featuresCachePath, JSON.stringify(payload, null, 2), 'utf-8')

console.log(
    `[build-uml-cache] ${payload.features.length} features → ${relative(repoRoot, featuresCachePath)}`
)
