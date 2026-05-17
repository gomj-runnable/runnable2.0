import type {
    RunRecordDraftInput,
    SavedRunRecord,
    RunInsightWeekly
} from '#shared/types/run-record'

export interface IRunRecordRepository {
    create(input: RunRecordDraftInput, userId: string): Promise<SavedRunRecord>
    getById(recordId: string): Promise<SavedRunRecord | null>
    listByUser(userId: string, limit?: number, offset?: number): Promise<SavedRunRecord[]>
    update(recordId: string, input: Partial<RunRecordDraftInput>): Promise<SavedRunRecord | null>
    delete(recordId: string): Promise<boolean>
    getWeeklyInsight(userId: string, weekStart: string): Promise<RunInsightWeekly>
}
