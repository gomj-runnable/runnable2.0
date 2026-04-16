export interface FeedbackBase {
    content: string
    longitude: number
    latitude: number
    elevation?: number
    authorName?: string
}

export interface SavedFeedback extends FeedbackBase {
    feedbackId: string
    routeId: string
    userId?: string
    createdAt?: string
}

export type FeedbackDraftInput = FeedbackBase
