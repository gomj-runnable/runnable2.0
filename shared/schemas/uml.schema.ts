import { z } from 'zod'

export const domainTabSchema = z.enum(['frontend', 'backend', 'architecture'])

export const diagramTypeSchema = z.enum(['class', 'flowchart', 'sequence', 'dependency'])

export const analyzeRequestSchema = z.object({
    domain: domainTabSchema,
    featureIds: z.array(z.string().min(1)).min(1).max(50),
    diagramType: diagramTypeSchema
})

export type AnalyzeRequestParsed = z.infer<typeof analyzeRequestSchema>
