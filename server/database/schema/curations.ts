import { pgTable, text, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { routes } from './routes'

export const curationCollections = pgTable(
    'curation_collections',
    {
        collectionId: text('collection_id').primaryKey(),
        createdBy: text('created_by')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 100 }).notNull(),
        description: text('description'),
        season: varchar('season', { length: 10 }).notNull(),
        theme: varchar('theme', { length: 30 }).notNull(),
        validFrom: varchar('valid_from', { length: 10 }).notNull(),
        validTo: varchar('valid_to', { length: 10 }).notNull(),
        coverImageUrl: text('cover_image_url'),
        routeCount: integer('route_count').notNull().default(0),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [
        index('curation_season_idx').on(table.season),
        index('curation_valid_idx').on(table.validFrom, table.validTo)
    ]
)

export const curationRoutes = pgTable(
    'curation_routes',
    {
        curationRouteId: text('curation_route_id').primaryKey(),
        collectionId: text('collection_id')
            .notNull()
            .references(() => curationCollections.collectionId, { onDelete: 'cascade' }),
        routeId: text('route_id')
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        recommendedHourLocal: integer('recommended_hour_local'),
        photoUrl: text('photo_url'),
        note: text('note'),
        sortOrder: integer('sort_order').notNull().default(0)
    },
    (table) => [index('curation_route_collection_idx').on(table.collectionId)]
)
