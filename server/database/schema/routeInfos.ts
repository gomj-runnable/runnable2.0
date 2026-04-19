import { pgTable, text, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core'
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
    lng: numeric('longitude', { precision: 12, scale: 8 }).notNull(),
    lat: numeric('latitude', { precision: 12, scale: 8 }).notNull(),
    elevation: numeric('elevation', { precision: 10, scale: 2 }),
    authorName: varchar('author_name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => [
    index('route_info_route_idx').on(table.routeId),
    index('route_info_user_idx').on(table.userId)
  ]
)
