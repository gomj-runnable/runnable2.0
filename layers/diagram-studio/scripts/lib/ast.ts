import { Project } from 'ts-morph'
import { resolve } from 'node:path'

export function createProject(root: string): Project {
    return new Project({
        tsConfigFilePath: resolve(root, 'tsconfig.json'),
        skipAddingFilesFromTsConfig: false,
        compilerOptions: {
            skipLibCheck: true
        }
    })
}

export function slugify(filePath: string, root: string): string {
    return filePath
        .replace(root, '')
        .replace(/\\/g, '/')
        .replace(/^\//, '')
        .replace(/\.(ts|tsx|vue)$/, '')
}
