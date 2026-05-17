import { getCurationRepository } from '../../repositories'

export default defineEventHandler(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const repo = await getCurationRepository()
    return repo.listActiveCollections(today)
})
