// GET /api/facilities - 전체 시설물 목록 조회
import { defineEventHandler } from 'h3'
import { getFacilityRepository } from '../../repositories'

export default defineEventHandler(async () => {
    return (await getFacilityRepository()).findAll()
})
