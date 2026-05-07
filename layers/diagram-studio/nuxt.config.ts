import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const layerDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(layerDir, '../../')
const manifestPath = resolve(projectRoot, 'app/manifests/diagram-studio/user-journey.yaml')

const WATCHED_EXTS = ['.ts', '.tsx', '.vue', '.yaml', '.yml']

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let running = false

function shouldHandlePath(path: string): boolean {
    return WATCHED_EXTS.some((ext) => path.endsWith(ext))
}

function scheduleRegeneration() {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        if (running) return
        running = true
        try {
            const { generate } = await import('./scripts/gen-diagrams')
            await generate(manifestPath, { quiet: false })
        } catch (err) {
            console.error('[diagram-studio] dev watch regeneration failed:', err)
        } finally {
            running = false
        }
    }, 300)
}

export default defineNuxtConfig({
    components: [
        {
            path: './app/components',
            pathPrefix: false
        }
    ],
    hooks: {
        'builder:watch': (_event, path) => {
            if (process.env.NODE_ENV !== 'development') return
            if (!shouldHandlePath(path)) return
            // 출력 폴더 자체 변화는 무시 (재진입 루프 방지)
            if (path.includes('public/diagrams/')) return
            scheduleRegeneration()
        }
    }
})
