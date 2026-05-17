import {
    pgTable,
    text,
    varchar,
    numeric,
    boolean,
    integer,
    timestamp,
    index,
    primaryKey
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { routes } from './routes'

export const segments = pgTable(
    'segments',
    {
        segmentId: text('segment_id').primaryKey(),
        ownerId: text('owner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 100 }).notNull(),
        description: text('description'),
        routeId: text('route_id')
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        startPositionIndex: integer('start_position_index').notNull(),
        endPositionIndex: integer('end_position_index').notNull(),
        distanceKm: numeric('distance_km', { precision: 8, scale: 3 }).notNull(),
        elevationGainM: numeric('elevation_gain_m', { precision: 8, scale: 2 }),
        isPublic: boolean('is_public').notNull().default(true),
        effortCount: integer('effort_count').notNull().default(0),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [
        index('segment_route_idx').on(table.routeId),
        index('segment_owner_idx').on(table.ownerId),
        index('segment_public_idx').on(table.isPublic)
    ]
)

export const segmentEfforts = pgTable(
    'segment_efforts',
    {
        effortId: text('effort_id').primaryKey(),
        segmentId: text('segment_id')
            .notNull()
            .references(() => segments.segmentId, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        durationSec: integer('duration_sec').notNull(),
        paceSecPerKm: numeric('pace_sec_per_km', { precision: 8, scale: 2 }).notNull(),
        completedAt: timestamp('completed_at').notNull().defaultNow()
    },
    (table) => [
        index('effort_segment_idx').on(table.segmentId),
        index('effort_user_idx').on(table.userId),
        index('effort_duration_idx').on(table.segmentId, table.durationSec)
    ]
)
