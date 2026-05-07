import { writeFileSync, mkdirSync, watch as fsWatch, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { analyzeFsd } from './analyzers/fsd-graph'
import { analyzeComposables } from './analyzers/composable-graph'
import { analyzeClasses } from './analyzers/class-diagram'
import { analyzeUserJourney } from './analyzers/user-journey'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../../../')
const outDir = resolve(root, 'public/diagrams')

const IGNORED_DIRS = new Set(['node_modules', '.nuxt', '.output', 'dist'])
const WATCHED_EXTS = new Set(['.ts', '.tsx', '.vue', '.yaml', '.yml'])

function getCommit(): string {
    try {
        return execSync('git rev-parse HEAD', { cwd: root }).toString().trim()
    } catch {
        return 'unknown'
    }
}

async function runAnalyzers(manifestPath: string): Promise<void> {
    const start = Date.now()
    mkdirSync(outDir, { recursive: true })

    const commit = getCommit()

    const results = await Promise.all([
        analyzeFsd(root),
        analyzeComposables(root),
        analyzeClasses(root),
        analyzeUserJourney(manifestPath)
    ])

    const files = ['fsd.json', 'composables.json', 'classes.json', 'user-journey.json']
    const labels = ['fsd', 'composables', 'classes', 'user-journey']

    for (let i = 0; i < results.length; i++) {
        const diagram = results[i]
        diagram.meta.sourceCommit = commit
        diagram.meta.nodeCount = diagram.nodes.length
        diagram.meta.edgeCount = diagram.edges.length
        writeFileSync(resolve(outDir, files[i]), JSON.stringify(diagram, null, 2))
    }

    const elapsed = Date.now() - start
    const summary = results
        .map((r, i) => `${labels[i]}: ${r.nodes.length}/${r.edges.length}`)
        .join(', ')
    console.log(`[diagram-studio] regenerated in ${elapsed}ms — ${summary}`)
}

function walkAndWatch(
    dir: string,
    watchers: Set<ReturnType<typeof fsWatch>>,
    onChange: () => void
): void {
    if (!existsSync(dir)) return
    try {
        const watcher = fsWatch(dir, { recursive: false }, (event, filename) => {
            if (!filename) return
            const ext = extname(filename)
            if (!WATCHED_EXTS.has(ext)) return
            onChange()
        })
        watchers.add(watcher)
    } catch {
        // directory may not support watching; skip silently
    }

    try {
        const entries = readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
            if (!entry.isDirectory()) continue
            if (IGNORED_DIRS.has(entry.name)) continue
            walkAndWatch(resolve(dir, entry.name), watchers, onChange)
        }
    } catch {
        // unreadable directory; skip
    }
}

function watchFile(
    filePath: string,
    watchers: Set<ReturnType<typeof fsWatch>>,
    onChange: () => void
): void {
    if (!existsSync(filePath)) return
    try {
        const watcher = fsWatch(filePath, () => onChange())
        watchers.add(watcher)
    } catch {
        // skip silently
    }
}

async function startWatchMode(manifestPath: string): Promise<void> {
    console.log('[diagram-studio] watch mode starting...')
    await runAnalyzers(manifestPath)

    const watchers = new Set<ReturnType<typeof fsWatch>>()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let running = false

    const onChange = () => {
        if (debounceTimer !== null) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
            if (running) return
            running = true
            try {
                await runAnalyzers(manifestPath)
            } catch (err) {
                console.error('[diagram-studio] error during regeneration:', err)
            } finally {
                running = false
            }
        }, 300)
    }

    const watchDirs = [resolve(root, 'app'), resolve(root, 'shared'), resolve(root, 'server')]

    for (const dir of watchDirs) {
        walkAndWatch(dir, watchers, onChange)
    }
    watchFile(manifestPath, watchers, onChange)

    console.log(
        `[diagram-studio] watching ${watchers.size} directories/files. Press Ctrl+C to stop.`
    )

    const shutdown = () => {
        if (debounceTimer !== null) clearTimeout(debounceTimer)
        for (const w of watchers) {
            try {
                w.close()
            } catch {
                /* ignore */
            }
        }
        console.log('[diagram-studio] stopped.')
        process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
}

async function main() {
    const args = process.argv.slice(2)
    const watchMode = args.includes('--watch')
    const manifestPath = resolve(root, 'app/manifests/diagram-studio/user-journey.yaml')

    if (watchMode) {
        await startWatchMode(manifestPath)
    } else {
        mkdirSync(outDir, { recursive: true })

        const commit = getCommit()

        const results = await Promise.all([
            analyzeFsd(root),
            analyzeComposables(root),
            analyzeClasses(root),
            analyzeUserJourney(manifestPath)
        ])

        const files = ['fsd.json', 'composables.json', 'classes.json', 'user-journey.json']

        for (let i = 0; i < results.length; i++) {
            const diagram = results[i]
            diagram.meta.sourceCommit = commit
            diagram.meta.nodeCount = diagram.nodes.length
            diagram.meta.edgeCount = diagram.edges.length
            writeFileSync(resolve(outDir, files[i]), JSON.stringify(diagram, null, 2))
            console.log(
                `wrote ${files[i]} (${diagram.nodes.length} nodes, ${diagram.edges.length} edges)`
            )
        }
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
