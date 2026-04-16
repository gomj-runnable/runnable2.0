import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../database/schema'
import { isMemoryMode } from './config'

const pool = isMemoryMode ? undefined : new pg.Pool({ connectionString: process.env.DATABASE_URL })
export const db = pool ? drizzle(pool, { schema }) : null
