// 사용자 플러그인 선호 Repository — 인터페이스 정의 + Drizzle ORM 구현 (활성 상태 upsert)
import { eq } from 'drizzle-orm'
import type { getDb } from '../database/client'
import { userFeaturePrefs } from '../database/schema/userFeaturePrefs'

/** 사용자별 플러그인 활성 상태 한 건. */
export interface FeaturePref {
    pluginId: string
    enabled: boolean
}

/**
 * 사용자 플러그인 선호 저장소 어댑터 인터페이스.
 * 구현체만 교체하면 저장 방식을 변경할 수 있다.
 */
export interface IUserFeaturePrefRepository {
    /** 해당 유저의 모든 플러그인 선호를 반환한다. */
    findByUserId(userId: string): Promise<FeaturePref[]>
    /** (userId, pluginId) 기준으로 활성 상태를 upsert 한다. */
    upsert(userId: string, pluginId: string, enabled: boolean): Promise<FeaturePref>
}

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
