import { defineConfig } from 'drizzle-kit'
import { getDatabaseUrl } from './server/config/dbMode'

export default defineConfig({
    schema: './server/database/schema.ts',
    out: './server/database/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: getDatabaseUrl()
    },
    tablesFilter: ['!spatial_ref_sys', '!geography_columns', '!geometry_columns']
})
