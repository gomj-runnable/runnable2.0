// 시설 종류별 속성 테이블 스키마 (facilities 1 : 0..1, facility_id 가 PK 겸 FK)
// EAV 대신 종류별 타입 컬럼으로 분리해 타입 안정성·쿼리 효율을 확보한다.
import { pgTable, varchar, text, boolean } from 'drizzle-orm/pg-core'
import { facilities } from './facilities'

// crosswalk_attribute — 횡단보도 전용 속성(보행신호등 유무). 선형(polyline)은 facilities.geom 으로 보관.
export const crosswalkAttribute = pgTable('crosswalk_attribute', {
    facilityId: varchar('facility_id', { length: 255 })
        .primaryKey()
        .references(() => facilities.id, { onDelete: 'cascade' }),
    hasSignal: boolean('has_signal') // 보행신호등 유무
})

// toilet_attribute — 화장실 전용 속성(운영시간·연락처)
export const toiletAttribute = pgTable('toilet_attribute', {
    facilityId: varchar('facility_id', { length: 255 })
        .primaryKey()
        .references(() => facilities.id, { onDelete: 'cascade' }),
    hours: text('hours'), // 운영 시간(자유 문자열)
    tel: text('tel') // 연락처
})

// hospital_attribute — 병원 전용 속성(운영시간·연락처)
export const hospitalAttribute = pgTable('hospital_attribute', {
    facilityId: varchar('facility_id', { length: 255 })
        .primaryKey()
        .references(() => facilities.id, { onDelete: 'cascade' }),
    hours: text('hours'), // 진료 시간(자유 문자열)
    tel: text('tel') // 연락처
})
