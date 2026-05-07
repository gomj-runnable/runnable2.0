import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import {
    userJourneyManifestSchema,
    formatZodError,
    type UserJourneyManifest
} from '../../manifests/__schemas/manifest'

export type { UserJourneyManifest } from '../../manifests/__schemas/manifest'

export function loadUserJourneyManifest(filePath: string): UserJourneyManifest {
    const raw = readFileSync(filePath, 'utf-8')
    const parsed = yaml.load(raw)
    const result = userJourneyManifestSchema.safeParse(parsed)
    if (!result.success) {
        throw new Error(formatZodError(result.error, filePath))
    }
    return result.data
}
