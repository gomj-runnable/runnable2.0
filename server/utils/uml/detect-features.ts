import { promises as fs } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type { DomainTab, Feature, FeaturesPayload } from '~~/shared/types/uml'
import { repoRoot, featuresCachePath, umlCacheDir } from './paths'

const FRONTEND_GROUPS = [
    { dir: 'app/pages', label: 'pages' },
    { dir: 'app/widgets', label: 'widgets' },
    { dir: 'app/features', label: 'features' },
    { dir: 'app/entities', label: 'entities' }
] as const

const BACKEND_GROUPS = [
    { dir: 'server/api', label: 'api' },
    { dir: 'server/services', label: 'services' },
    { dir: 'server/repositories', label: 'repositories' },
    { dir: 'server/database', label: 'database' },
    { dir: 'server/utils', label: 'utils' }
] as const

interface ArchCategory {
    id: string
    name: string
    description: string
    paths: string[]
}

const ARCH_CATEGORIES: ArchCategory[] = [
    {
        id: 'architecture:runtime',
        name: 'runtime',
        description: 'Nuxt/Nitro 런타임, plugins, middleware',
        paths: [
            'nuxt.config.ts',
            'app/plugins',
            'app/middleware',
            'server/plugins',
            'server/middleware'
        ]
    },
    {
        id: 'architecture:dependencies',
        name: 'dependencies',
        description: 'package.json 프로덕션 의존성',
        paths: ['package.json']
    },
    {
        id: 'architecture:dev-tools',
        name: 'dev-tools',
        description: 'devDependencies, 빌드/테스트 도구',
        paths: ['package.json', 'eslint.config.mjs', 'vitest.config.ts', 'tsconfig.json']
    },
    {
        id: 'architecture:data-layer',
        name: 'data-layer',
        description: 'DB, ORM, 캐시',
        paths: ['server/database', 'server/repositories']
    },
    {
        id: 'architecture:external-services',
        name: 'external-services',
        description: '외부 API/인증/지도 등',
        paths: ['server/services']
    }
]

const SKIP_DIRS = new Set(['__tests__', '__mocks__', 'node_modules', '.nuxt', '.output'])
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.vue', '.mjs', '.js'])

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p)
        return true
    } catch {
        return false
    }
}

async function countSourceFiles(rootPath: string): Promise<number> {
    let count = 0
    if (!(await exists(rootPath))) return 0
    const stack: string[] = [rootPath]
    while (stack.length) {
        const cur = stack.pop()!
        let entries: import('node:fs').Dirent[]
        try {
            entries = await fs.readdir(cur, { withFileTypes: true })
        } catch {
            continue
        }
        for (const ent of entries) {
            if (ent.isDirectory()) {
                if (SKIP_DIRS.has(ent.name)) continue
                stack.push(join(cur, ent.name))
            } else if (ent.isFile()) {
                const dot = ent.name.lastIndexOf('.')
                const ext = dot >= 0 ? ent.name.slice(dot) : ''
                if (SOURCE_EXTS.has(ext)) count++
            }
        }
    }
    return count
}

async function listChildDirs(absParent: string): Promise<string[]> {
    if (!(await exists(absParent))) return []
    const entries = await fs.readdir(absParent, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name)).map((e) => e.name)
}

async function detectFrontend(): Promise<Feature[]> {
    const features: Feature[] = []
    const now = new Date().toISOString()

    for (const group of FRONTEND_GROUPS) {
        const absGroup = resolve(repoRoot, group.dir)
        const children = await listChildDirs(absGroup)
        for (const child of children) {
            const absChild = resolve(absGroup, child)
            const fileCount = await countSourceFiles(absChild)
            features.push({
                id: `frontend:${group.label}:${child}`,
                domain: 'frontend',
                name: `${group.label}/${child}`,
                description: `app/${group.label}/${child}`,
                paths: [relative(repoRoot, absChild)],
                fileCount,
                detectedAt: now
            })
        }
    }

    const indexVue = resolve(repoRoot, 'app/pages/index.vue')
    if (await exists(indexVue)) {
        features.push({
            id: 'frontend:pages:_root',
            domain: 'frontend',
            name: 'pages/(root)',
            description: 'app/pages/index.vue 등 최상위 라우트',
            paths: ['app/pages/index.vue'],
            fileCount: 1,
            detectedAt: now
        })
    }

    return features
}

async function detectBackend(): Promise<Feature[]> {
    const features: Feature[] = []
    const now = new Date().toISOString()

    for (const group of BACKEND_GROUPS) {
        const absGroup = resolve(repoRoot, group.dir)
        if (!(await exists(absGroup))) continue

        const children = await listChildDirs(absGroup)
        if (children.length === 0) {
            const fileCount = await countSourceFiles(absGroup)
            if (fileCount > 0) {
                features.push({
                    id: `backend:${group.label}`,
                    domain: 'backend',
                    name: group.label,
                    description: group.dir,
                    paths: [group.dir],
                    fileCount,
                    detectedAt: now
                })
            }
            continue
        }

        for (const child of children) {
            const absChild = resolve(absGroup, child)
            const fileCount = await countSourceFiles(absChild)
            features.push({
                id: `backend:${group.label}:${child}`,
                domain: 'backend',
                name: `${group.label}/${child}`,
                description: `server/${group.label}/${child}`,
                paths: [relative(repoRoot, absChild)],
                fileCount,
                detectedAt: now
            })
        }
    }
    return features
}

async function detectArchitecture(): Promise<Feature[]> {
    const features: Feature[] = []
    const now = new Date().toISOString()

    for (const cat of ARCH_CATEGORIES) {
        let fileCount = 0
        for (const p of cat.paths) {
            const abs = resolve(repoRoot, p)
            if (!(await exists(abs))) continue
            const stat = await fs.stat(abs)
            if (stat.isDirectory()) {
                fileCount += await countSourceFiles(abs)
            } else {
                fileCount += 1
            }
        }
        features.push({
            id: cat.id,
            domain: 'architecture',
            name: cat.name,
            description: cat.description,
            paths: cat.paths,
            fileCount,
            detectedAt: now
        })
    }
    return features
}

export async function detectAllFeatures(): Promise<FeaturesPayload> {
    const [fe, be, ar] = await Promise.all([
        detectFrontend(),
        detectBackend(),
        detectArchitecture()
    ])
    return {
        features: [...fe, ...be, ...ar],
        scannedAt: new Date().toISOString()
    }
}

export async function loadFeaturesCache(): Promise<FeaturesPayload | null> {
    try {
        const raw = await fs.readFile(featuresCachePath, 'utf-8')
        return JSON.parse(raw) as FeaturesPayload
    } catch {
        return null
    }
}

export async function writeFeaturesCache(payload: FeaturesPayload): Promise<void> {
    await fs.mkdir(dirname(featuresCachePath), { recursive: true })
    await fs.writeFile(featuresCachePath, JSON.stringify(payload, null, 2), 'utf-8')
}

export async function getOrDetectFeatures(): Promise<FeaturesPayload> {
    const cached = await loadFeaturesCache()
    if (cached) return cached
    const fresh = await detectAllFeatures()
    await fs.mkdir(umlCacheDir, { recursive: true })
    await writeFeaturesCache(fresh)
    return fresh
}

export async function rescanFeatures(): Promise<FeaturesPayload> {
    const fresh = await detectAllFeatures()
    await writeFeaturesCache(fresh)
    return fresh
}

export function findFeatures(
    payload: FeaturesPayload,
    domain: DomainTab,
    ids: string[]
): Feature[] {
    const set = new Set(ids)
    return payload.features.filter((f) => f.domain === domain && set.has(f.id))
}
