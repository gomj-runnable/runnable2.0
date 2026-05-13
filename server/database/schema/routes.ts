import {
    pgTable,
    text,
    varchar,
    numeric,
    boolean,
    timestamp,
    index,
    integer,
    primaryKey
} from 'drizzle-orm/pg-core'
import { users } from './users'

// routes
export const routes = pgTable(
    'routes',
    {
        routeId: text('route_id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description'),
        highHeight: numeric('high_height', { precision: 10, scale: 2 }),
        lowHeight: numeric('low_height', { precision: 10, scale: 2 }),
        distance: numeric('distance', { precision: 12, scale: 2 }),
        isPublic: boolean('is_public').notNull().default(true),
        sourceRouteId: text('source_route_id'),
        sgg: text('sgg'), // text+JSON: 비정규화 필터용, 조인 테이블 없이 단순 조회
        emd: text('emd'),
        viewCount: integer('view_count').notNull().default(0),
        likeCount: integer('like_count').notNull().default(0),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at')
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date())
    },
    (table) => [
        index('route_user_idx').on(table.userId),
        index('route_public_idx').on(table.isPublic),
        index('route_title_idx').on(table.title),
        index('route_like_count_idx').on(table.likeCount)
    ]
)

// route_likes
export const routeLikes = pgTable(
    'route_likes',
    {
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        routeId: text('route_id')
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [primaryKey({ columns: [table.userId, table.routeId] })]
)

// route_sections
export const routeSections = pgTable(
    'route_sections',
    {
        sectionId: text('section_id').primaryKey(),
        routeId: text('route_id')
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        geom: text('geom'), // GeoJSON LineString as JSON string
        attrs: text('attrs'), // SectionAttr[] as JSON string
        pois: text('pois'), // PoiDraftInput[] as JSON string
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [index('section_route_idx').on(table.routeId)]
)
