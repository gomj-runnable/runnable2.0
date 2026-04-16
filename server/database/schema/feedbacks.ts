import { pgTable, text, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core'
import { routes } from './routes'
import { users } from './users'

// route_feedbacks
export const routeFeedbacks = pgTable(
  'route_feedbacks',
  {
    feedbackId: text('feedback_id').primaryKey(),
    routeId: text('route_id')
      .notNull()
      .references(() => routes.routeId, { onDelete: 'cascade' }),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    longitude: numeric('longitude', { precision: 12, scale: 8 }).notNull(),
    latitude: numeric('latitude', { precision: 12, scale: 8 }).notNull(),
    elevation: numeric('elevation', { precision: 10, scale: 2 }),
    authorName: varchar('author_name', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => [
    index('feedback_route_idx').on(table.routeId),
    index('feedback_user_idx').on(table.userId)
  ]
)
