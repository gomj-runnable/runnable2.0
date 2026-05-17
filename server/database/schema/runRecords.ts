import {
    pgTable,
    text,
    varchar,
    numeric,
    integer,
    timestamp,
    index,
    jsonb
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { routes } from './routes'

export const runRecords = pgTable(
    'run_records',
    {
        recordId: text('record_id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        routeId: text('route_id').references(() => routes.routeId, { onDelete: 'set null' }),
        runDate: varchar('run_date', { length: 10 }).notNull(),
        distanceKm: numeric('distance_km', { precision: 8, scale: 3 }).notNull(),
        durationSec: integer('duration_sec').notNull(),
        avgPaceSecPerKm: numeric('avg_pace_sec_per_km', { precision: 8, scale: 2 }).notNull(),
        rpe: integer('rpe').notNull(),
        condition: varchar('condition', { length: 10 }).notNull(),
        sleepHours: numeric('sleep_hours', { precision: 4, scale: 1 }),
        stressLevel: integer('stress_level'),
        painAreas: jsonb('pain_areas').$type<string[]>(),
        weatherSnapshot: jsonb('weather_snapshot').$type<{
            tempC: number
            humidity: number
            pm10?: number
        }>(),
        notes: text('notes'),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [
        index('run_record_user_idx').on(table.userId),
        index('run_record_date_idx').on(table.userId, table.runDate),
        index('run_record_route_idx').on(table.routeId)
    ]
)
