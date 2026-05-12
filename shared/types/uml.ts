export type DomainTab = 'frontend' | 'backend' | 'architecture'

export type DiagramType = 'class' | 'flowchart' | 'sequence' | 'dependency'

export interface Feature {
    id: string // 예: 'frontend:auth'
    domain: DomainTab
    name: string
    description?: string
    paths: string[] // 이 feature 에 속하는 파일/디렉터리 경로
    fileCount: number
    detectedAt: string // ISO timestamp
}

export interface FeaturesPayload {
    features: Feature[]
    scannedAt: string
}

export interface AnalyzeRequestBody {
    domain: DomainTab
    featureIds: string[]
    diagramType: DiagramType
}

export interface AnalyzeResponseItem {
    featureId: string
    mermaid: string
    error?: string
}
