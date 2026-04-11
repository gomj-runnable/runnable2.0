import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../database/schema'

const isMemoryMode = process.env.USE_DATABASE_MODE === 'MEMORY'

const pool = isMemoryMode ? undefined : new pg.Pool({ connectionString: process.env.DATABASE_URL })
export const db = pool ? drizzle(pool, { schema }) : null
