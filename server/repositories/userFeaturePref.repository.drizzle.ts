import { eq } from 'drizzle-orm'
import type { IUserFeaturePrefRepository, FeaturePref } from './userFeaturePref.repository'
import type { getDb } from '../database/client'
import { userFeaturePrefs } from '../database/schema/userFeaturePrefs'

type Db = Awaited<ReturnType<typeof getDb>>

const toFeaturePref = (row: typeof userFeaturePrefs.$inferSelect): FeaturePref => ({
    pluginId: row.pluginId,
    enabled: row.enabled
})

export class DrizzleUserFeaturePrefRepository implements IUserFeaturePrefRepository {
    constructor(private readonly db: Db) {}

    async findByUserId(userId: string): Promise<FeaturePref[]> {
        const rows = await this.db
            .select()
            .from(userFeaturePrefs)
            .where(eq(userFeaturePrefs.userId, userId))
        return rows.map(toFeaturePref)
    }

    async upsert(userId: string, pluginId: string, enabled: boolean): Promise<FeaturePref> {
        const [row] = await this.db
            .insert(userFeaturePrefs)
            .values({ id: crypto.randomUUID(), userId, pluginId, enabled })
            .onConflictDoUpdate({
                target: [userFeaturePrefs.userId, userFeaturePrefs.pluginId],
                set: { enabled }
            })
            .returning()

        if (!row) throw new Error('Failed to upsert user feature pref')
        return toFeaturePref(row)
    }
}
