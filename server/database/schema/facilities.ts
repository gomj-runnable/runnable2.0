// 러닝 경로 주변 시설물(화장실·병원·식수대 등) 테이블 스키마
// 위치/형상(geom)은 PostGIS 컬럼으로 마이그레이션에서 Postgres 전용으로 추가하며(PGlite 미지원),
// 운영시간·연락처 등 가변 속성은 facilitiesAttribute, 외부 링크는 facilitiesReference 로 분리한다.
import { pgTable, text, varchar, index } from 'drizzle-orm/pg-core'

export const facilities = pgTable(
    'facilities',
    {
        id: varchar('id', { length: 255 }).primaryKey(), // 외부 출처 ID(공공데이터 등) 그대로 사용
        type: varchar('type', { length: 50 }).notNull(), // 시설 종류(toilet/hospital/fountain/crosswalk 등)
        name: varchar('name', { length: 255 }).notNull(),
        description: text('description')
    },
    (table) => [index('facility_type_idx').on(table.type)] // 종류별 시설 필터
)
