// route_section_pois: 구간(route_sections)에 연결된 관심지점(POI) 테이블 (1:N).
// 위치(geom)는 PostGIS geometry(PointZ,4326) 로 마이그레이션·raw SQL 이 전담(facilities 패턴, PGlite 미지원이라 schema 에서 제외). 3D Point(ST_Force3D, 2D 입력은 Z=0) 저장.
import { pgTable, text, varchar, jsonb, index } from 'drizzle-orm/pg-core'
import { routeSections } from './routes'

export const routeSectionPois = pgTable(
    'route_section_pois',
    {
        poiId: text('poi_id').primaryKey(),
        sectionId: text('section_id') // 소속 구간. 구간 삭제 시 POI 도 함께 삭제
            .notNull()
            .references(() => routeSections.sectionId, { onDelete: 'cascade' }),
        type: varchar('type', { length: 50 }).notNull(), // POI 종류(HOSPITAL/CROSSWALK/WATER)
        name: varchar('name', { length: 255 }).notNull(),
        description: text('description'),
        attribute: jsonb('attribute') // 가변 속성(Record<string, unknown>)
    },
    (table) => [index('poi_section_idx').on(table.sectionId)] // 구간별 POI 일괄 조회
)
