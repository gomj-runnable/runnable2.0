import { pgTable, text, varchar, numeric, boolean, jsonb, index } from 'drizzle-orm/pg-core'

export const facilities = pgTable(
    'facilities',
    {
        id: varchar('id', { length: 255 }).primaryKey(),
        type: varchar('type', { length: 50 }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        description: text('description'),
        lng: numeric('lng', { precision: 12, scale: 8 }).notNull(),
        lat: numeric('lat', { precision: 12, scale: 8 }).notNull(),
        hours: varchar('hours', { length: 255 }),
        tel: varchar('tel', { length: 100 }),
        /** 횡단보도 전용: 보행신호등 유무 */
        hasSignal: boolean('has_signal'),
        /** 횡단보도 전용: 폴리라인 좌표 [[lng, lat], ...] */
        polyline: jsonb('polyline').$type<[number, number][]>()
    },
    (table) => [index('facility_type_idx').on(table.type)]
)
