// 경로 위치 정보(포인트 마커) 테이블 스키마.
// 위치(geom)는 PostGIS geometry(PointZ,4326) 로 마이그레이션·raw SQL 이 전담(facilities 패턴, PGlite 미지원이라 schema 에서 제외).
import { pgTable, text, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { routes } from './routes'
import { users } from './users'

// route_infos
export const routeInfos = pgTable(
    'route_infos',
    {
        routeInfoId: text('route_info_id').primaryKey(),
        routeId: text('route_id')
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 100 }).notNull(),
        description: text('description').notNull(),
        authorName: varchar('author_name', { length: 100 }).notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [
        index('route_info_route_idx').on(table.routeId),
        index('route_info_user_idx').on(table.userId)
    ]
)
