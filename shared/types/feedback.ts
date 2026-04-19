export interface FeedbackBase {
    name: string
    description: string
    longitude: number
    latitude: number
    elevation?: number
}

export interface SavedFeedback extends FeedbackBase {
    feedbackId: string
    routeId: string
    userId: string
    authorName: string
    createdAt?: string
}

export type FeedbackDraftInput = FeedbackBase
