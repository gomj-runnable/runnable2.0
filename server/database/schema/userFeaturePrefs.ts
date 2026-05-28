import { pgTable, text, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { users } from './users'

// user_feature_prefs — 사용자별 플러그인 활성 여부.
export const userFeaturePrefs = pgTable(
    'user_feature_prefs',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        pluginId: text('plugin_id').notNull(),
        enabled: boolean('enabled').notNull().default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at')
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date())
    },
    (table) => [
        index('user_feature_prefs_user_idx').on(table.userId),
        unique('user_feature_prefs_user_plugin_uq').on(table.userId, table.pluginId)
    ]
)
