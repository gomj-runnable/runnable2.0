export const isMemoryMode = process.env.USE_DATABASE_MODE === 'MEMORY'

if (isMemoryMode && process.env.NODE_ENV === 'production') {
    throw new Error('MEMORY mode must not be used in production.')
}
