import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'

interface ManifestStep {
    id: string
    label: string
    next: string[]
}

interface UserJourneyManifest {
    steps: ManifestStep[]
}

export function loadUserJourneyManifest(filePath: string): UserJourneyManifest {
    const raw = readFileSync(filePath, 'utf-8')
    return yaml.load(raw) as UserJourneyManifest
}
