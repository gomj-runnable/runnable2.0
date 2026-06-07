import {
    pgTable,
    text,
    varchar,
    numeric,
    boolean,
    timestamp,
    index,
    integer,
    primaryKey
} from 'drizzle-orm/pg-core'
import { users } from './users'

// routes: 러닝 경로의 최상위 메타데이터. 실제 좌표/구간은 route_sections 에 분리 저장
export const routes = pgTable(
    'routes',
    {
        routeId: text('route_id').primaryKey(),
        userId: text('user_id') // 작성자. 유저 삭제 시 경로도 함께 삭제
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description'),
        highHeight: numeric('high_height', { precision: 10, scale: 2 }), // 최고 고도(m)
        lowHeight: numeric('low_height', { precision: 10, scale: 2 }), // 최저 고도(m)
        distance: numeric('distance', { precision: 12, scale: 2 }), // 총 거리(m)
        isPublic: boolean('is_public').notNull().default(true), // 공개 여부(목록 노출 기준)
        sourceRouteId: text('source_route_id'), // 복제 시 원본 경로 routeId (출처 추적용)
        sgg: text('sgg'), // 시군구 코드. text+JSON: 비정규화 필터용, 조인 테이블 없이 단순 조회
        emd: text('emd'), // 읍면동 코드. sgg 와 동일한 비정규화 필터 패턴
        viewCount: integer('view_count').notNull().default(0), // 조회수(집계 캐시)
        likeCount: integer('like_count').notNull().default(0), // 좋아요 수(route_likes 집계 캐시)
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at') // 수정 시 자동 갱신
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date())
    },
    (table) => [
        index('route_user_idx').on(table.userId), // 내 경로 목록 조회
        index('route_public_idx').on(table.isPublic), // 공개 경로 필터
        index('route_title_idx').on(table.title), // 제목 검색
        index('route_like_count_idx').on(table.likeCount) // 인기순 정렬
    ]
)

// route_likes: 유저-경로 좋아요 매핑(N:M). 집계값은 routes.likeCount 에 캐시
export const routeLikes = pgTable(
    'route_likes',
    {
        userId: text('user_id') // 좋아요 누른 유저
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        routeId: text('route_id') // 대상 경로
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    // (userId, routeId) 복합 PK: 한 유저가 같은 경로에 중복 좋아요 불가
    (table) => [primaryKey({ columns: [table.userId, table.routeId] })]
)

// route_sections: 경로를 이루는 구간(1:N).
// geom 은 PostGIS geometry(LineStringZ,4326) 로 마이그레이션·raw SQL 이 전담(facilities 패턴, PGlite 미지원이라 schema 에서 제외). 3D LineString(ST_Force3D) 저장.
// pois 는 route_section_pois 테이블로 정규화 분리. attrs 만 JSON 문자열로 직접 보관.
export const routeSections = pgTable(
    'route_sections',
    {
        sectionId: text('section_id').primaryKey(),
        routeId: text('route_id') // 소속 경로. 경로 삭제 시 구간도 함께 삭제
            .notNull()
            .references(() => routes.routeId, { onDelete: 'cascade' }),
        attrs: text('attrs'), // SectionAttr[] as JSON string (구간별 속성 배열)
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [index('section_route_idx').on(table.routeId)] // 경로별 구간 일괄 조회
)
