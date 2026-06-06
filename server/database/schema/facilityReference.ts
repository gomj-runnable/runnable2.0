// 시설물 외부 참조(링크) 테이블 스키마 — 시설 관련 URL 등을 보관 (facilities 1 : N)
import { pgTable, text, varchar, index } from 'drizzle-orm/pg-core'
import { facilities } from './facilities'

// facility_reference — 시설 참조 링크
export const facilityReference = pgTable(
    'facility_reference',
    {
        id: varchar('id', { length: 255 }).primaryKey(),
        // 소속 시설. 시설 삭제 시 참조도 함께 삭제(cascade)
        facilityId: varchar('facility_id', { length: 255 })
            .notNull()
            .references(() => facilities.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(), // 참조 명
        description: text('description').notNull(),
        url: text('url').notNull() // 참조 URL
    },
    (t) => [index('facility_reference_facility_idx').on(t.facilityId)] // 시설별 참조 조회
)
