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

interface InfraCategory {
    id: string
    domain: DomainTab
    name: string
    description: string
    paths: string[]
}

// #125: 기존 architecture 카테고리 5종을 library(3) / backend:infra(2) 로 재매핑
const LIBRARY_CATEGORIES: InfraCategory[] = [
    {
        id: 'library:runtime',
        domain: 'library',
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
        id: 'library:dependencies',
        domain: 'library',
        name: 'dependencies',
        description: 'package.json 프로덕션 의존성',
        paths: ['package.json']
    },
    {
        id: 'library:dev-tools',
        domain: 'library',
        name: 'dev-tools',
        description: 'devDependencies, 빌드/테스트 도구',
        paths: ['package.json', 'eslint.config.mjs', 'vitest.config.ts', 'tsconfig.json']
    }
]

const BACKEND_INFRA_CATEGORIES: InfraCategory[] = [
    {
        id: 'backend:infra:data-layer',
        domain: 'backend',
        name: 'infra/data-layer',
        description: 'DB, ORM, 캐시',
        paths: ['server/database', 'server/repositories']
    },
    {
        id: 'backend:infra:external-services',
        domain: 'backend',
        name: 'infra/external-services',
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

async function countCategoryFiles(cat: InfraCategory): Promise<number> {
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
    return fileCount
}

async function detectFromCategories(categories: InfraCategory[]): Promise<Feature[]> {
    const now = new Date().toISOString()
    const features: Feature[] = []
    for (const cat of categories) {
        features.push({
            id: cat.id,
            domain: cat.domain,
            name: cat.name,
            description: cat.description,
            paths: cat.paths,
            fileCount: await countCategoryFiles(cat),
            detectedAt: now
        })
    }
    return features
}

// #125: 기획 다이어그램(user-journey 등)은 데이터 소스가 추가될 때까지 자리만 마련
async function detectPlanning(): Promise<Feature[]> {
    return []
}

export async function detectAllFeatures(): Promise<FeaturesPayload> {
    const [pl, fe, be, beInfra, lib] = await Promise.all([
        detectPlanning(),
        detectFrontend(),
        detectBackend(),
        detectFromCategories(BACKEND_INFRA_CATEGORIES),
        detectFromCategories(LIBRARY_CATEGORIES)
    ])
    return {
        features: [...pl, ...fe, ...be, ...beInfra, ...lib],
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
    // 빈 detect 결과는 cache poisoning 의 원인이므로 저장 skip.
    if (payload.features.length === 0) return
    await fs.mkdir(dirname(featuresCachePath), { recursive: true })
    await fs.writeFile(featuresCachePath, JSON.stringify(payload, null, 2), 'utf-8')
}

export async function getOrDetectFeatures(): Promise<FeaturesPayload> {
    const cached = await loadFeaturesCache()
    if (cached && cached.features.length > 0) return cached
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
