import { pgTable, text, varchar, numeric, index } from 'drizzle-orm/pg-core'

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
        tel: varchar('tel', { length: 100 })
    },
    (table) => [index('facility_type_idx').on(table.type)]
)
