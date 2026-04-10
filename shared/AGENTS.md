<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# shared

## Purpose
프론트엔드와 백엔드가 공유하는 도메인 타입, 런타임 검증 스키마, 상수, 샘플 데이터의 단일 진실 공급원(Single Source of Truth).
로컬 정의를 복제하지 않고 이 디렉터리에서 공용 정의를 관리한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `types/` | 도메인 타입 정의 — route, cesium, geojson, weather, user, category, theme-map, common |
| `schemas/` | Zod 런타임 검증 스키마 — route, user, user-route, category |
| `constants/` | 공유 상수 — route, roles |
| `data/` | 샘플/목업 데이터, 개발용 fixtures |

## Key Files

### types/
| File | Description |
|------|-------------|
| `route.ts` | RouteBase, SavedRoute, RouteSectionBase, SavedSection, RouteElevationProfile |
| `cesium.ts` | CesiumRuntime, CesiumViewerRuntime, CesiumDrawHandler — Cesium 전역 타입 래핑 |
| `geojson.ts` | GeoJsonPosition, GeoJsonLineString — GeoJSON 좌표 타입 |
| `weather.ts` | 날씨 도메인 타입 |
| `user.ts` | 사용자 타입 |
| `user-route.ts` | 사용자-경로 관계 타입 |
| `category.ts` | 카테고리 타입 |
| `theme-map.ts` | 테마 지도 타입 |
| `common.ts` | CommonResponse<T> 공통 응답 래퍼 |

### schemas/
| File | Description |
|------|-------------|
| `route.schema.ts` | createRouteSchema, createSectionSchema, sectionAttrSchema, geoJsonLineStringSchema, RouteDraftBuilder 클래스 |
| `user.schema.ts` | 사용자 검증 스키마 |
| `user-route.schema.ts` | 사용자-경로 검증 스키마 |
| `category.schema.ts` | 카테고리 검증 스키마 |

### constants/
| File | Description |
|------|-------------|
| `route.ts` | 경로 관련 상수 |
| `roles.ts` | 역할 상수 |

## For AI Agents

### Working In This Directory
- 타입 정의의 기준은 `types/`, 검증 스키마의 기준은 `schemas/`
- `schemas/`에서 정의된 Zod 스키마는 타입으로도 사용 가능 (`z.infer`)
- 프론트엔드·백엔드에서 동일 정의가 필요하면 로컬 복제 대신 여기에 추가
- `RouteDraftBuilder` 클래스는 경로 저장 payload 빌더 패턴
- Cesium 타입(`cesium.ts`)은 `window.Cesium` 런타임 객체의 TypeScript 래핑

### Common Patterns
- 타입과 스키마는 같은 도메인에 대해 쌍으로 관리 (e.g., `types/route.ts` + `schemas/route.schema.ts`)
- `CommonResponse<T>` = `{ state: 'success' | 'fail'; data?: T; message?: string }`
- Nuxt auto-import: `#shared/types/...`, `#shared/schemas/...`

### Testing Requirements
- `pnpm typecheck` 통과
- 스키마 변경 시 프론트엔드·백엔드 양쪽 빌드 확인

## Dependencies

### External
- Zod — 런타임 검증
- Cesium types — `cesium.ts`에서 import

<!-- MANUAL: -->
