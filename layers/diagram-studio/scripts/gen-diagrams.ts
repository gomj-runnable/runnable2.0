import { writeFileSync, mkdirSync, watch as fsWatch, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { analyzeFsd } from './analyzers/fsd-graph'
import { analyzeComposables } from './analyzers/composable-graph'
import { analyzeClasses } from './analyzers/class-diagram'
import { analyzeUserJourney } from './analyzers/user-journey'
import { convertFsd, convertUserJourney, convertComposables, convertClasses } from './gen-mermaid'
import type { DiagramJSON, TabKind } from '../runtime/types'

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

function emptySkeleton(kind: TabKind, error: string): DiagramJSON {
    return {
        kind,
        nodes: [],
        edges: [],
        meta: {
            generatedAt: new Date().toISOString(),
            sourceCommit: '',
            nodeCount: 0,
            edgeCount: 0,
            error
        }
    }
}

interface AnalyzerEntry {
    kind: TabKind
    file: string
    run: () => Promise<DiagramJSON>
}

function getAnalyzers(manifestPath: string): AnalyzerEntry[] {
    return [
        { kind: 'fsd', file: 'fsd.json', run: () => analyzeFsd(root) },
        { kind: 'composables', file: 'composables.json', run: () => analyzeComposables(root) },
        { kind: 'classes', file: 'classes.json', run: () => analyzeClasses(root) },
        {
            kind: 'user-journey',
            file: 'user-journey.json',
            run: () => analyzeUserJourney(manifestPath)
        }
    ]
}

async function safeRun(entry: AnalyzerEntry, strict: boolean): Promise<DiagramJSON> {
    try {
        return await entry.run()
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[diagram-studio] kind=${entry.kind} generation failed: ${message}`)
        if (strict) throw err
        return emptySkeleton(entry.kind, message)
    }
}

export interface GenerateOptions {
    strict?: boolean
    quiet?: boolean
}

export async function generate(
    manifestPath: string = resolve(root, 'app/manifests/diagram-studio/user-journey.yaml'),
    options: GenerateOptions = {}
): Promise<void> {
    const start = Date.now()
    const strict = options.strict ?? process.env.DIAGRAM_STUDIO_STRICT === '1'
    const quiet = options.quiet ?? false

    mkdirSync(outDir, { recursive: true })
    const commit = getCommit()
    const analyzers = getAnalyzers(manifestPath)

    const results: DiagramJSON[] = []
    for (const entry of analyzers) {
        const diagram = await safeRun(entry, strict)
        diagram.meta.sourceCommit = commit
        diagram.meta.nodeCount = diagram.nodes.length
        diagram.meta.edgeCount = diagram.edges.length
        writeFileSync(resolve(outDir, entry.file), JSON.stringify(diagram, null, 2))
        results.push(diagram)
    }

    const mmdDir = resolve(root, 'docs/diagrams')
    mkdirSync(mmdDir, { recursive: true })
    const mmdConverters: Array<{ name: string; convert: () => string }> = [
        { name: 'fsd', convert: convertFsd },
        { name: 'user-journey', convert: convertUserJourney },
        { name: 'composables', convert: convertComposables },
        { name: 'classes', convert: convertClasses },
    ]
    const banner = '<!-- AUTO-GENERATED — do not edit by hand. Run: pnpm gen:diagrams -->'
    for (const { name, convert } of mmdConverters) {
        try {
            const mmd = convert()
            writeFileSync(resolve(mmdDir, `${name}.mmd`), mmd, 'utf-8')
            writeFileSync(resolve(mmdDir, `${name}.md`), `${banner}\n\`\`\`mermaid\n${mmd}\`\`\`\n`, 'utf-8')
        } catch (err) {
            if (!quiet) console.error(`[diagram-studio] mermaid export failed for ${name}:`, err)
        }
    }

    if (!quiet) {
        const elapsed = Date.now() - start
        const summary = analyzers
            .map((a, i) => `${a.kind}: ${results[i]!.nodes.length}/${results[i]!.edges.length}`)
            .join(', ')
        console.log(`[diagram-studio] regenerated in ${elapsed}ms — ${summary}`)
    }
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
    await generate(manifestPath)

    const watchers = new Set<ReturnType<typeof fsWatch>>()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let running = false

    const onChange = () => {
        if (debounceTimer !== null) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
            if (running) return
            running = true
            try {
                await generate(manifestPath)
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
        await generate(manifestPath)
    }
}

const isDirectInvocation = (() => {
    if (!process.argv[1]) return false
    try {
        return fileURLToPath(import.meta.url) === resolve(process.argv[1])
    } catch {
        return false
    }
})()

if (isDirectInvocation) {
    main().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}
