<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# Runnable

## Purpose
Cesium 3D 지도 위에서 러닝 경로를 제작·관리하는 풀스택 서비스.
프론트엔드(Nuxt 4/Vue 3), 백엔드(Nitro), 공유 도메인(shared/)으로 구성한다.

## Key Files
| File | Description |
|------|-------------|
| `nuxt.config.ts` | Nuxt 설정, Cesium 정적 자산 경로, TailwindCSS, 런타임 환경변수 |
| `package.json` | 의존성 및 스크립트 (pnpm) |
| `drizzle.config.ts` | Drizzle ORM/마이그레이션 설정 |
| `tsconfig.json` | TypeScript 설정 |
| `Dockerfile` / `docker-compose.yml` | 컨테이너 배포 |
| `deploy.sh` | 배포 스크립트 |
| `eslint.config.mjs` | ESLint 설정 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `app/` | 프론트엔드 — Vue 컴포넌트, 페이지, composable, CSS (see `app/AGENTS.md`) |
| `server/` | 백엔드 — API, DB, 인증, 외부 서비스 (see `server/AGENTS.md`) |
| `shared/` | 프론트·백엔드 공용 타입, 스키마, 상수, 데이터 (see `shared/AGENTS.md`) |
| `lib/cesium/` | Cesium 정적 자산 — 직접 수정 금지, 래핑으로 대응 |
| `public/` | 정적 자료, 요구사항 문서, 참고 이미지 |

## For AI Agents

### 3-에이전트 팀 워크플로우
모든 비trivial 작업은 아래 구조로 진행한다:

| 역할 | 모델 | 책임 |
|------|------|------|
| **설계 (Architect)** | Claude Opus 4.6 | 시스템 분석, 구현 계획, 브리프 작성 |
| **코딩 (Builder)** | Claude Sonnet 4.5 | 브리프 기반 코드 구현 |
| **테스트 (Tester)** | Claude Sonnet 4.5 | 품질 검증, 성능 테스트 |

작업 순서: Architect → Builder → Tester → Architect(최종 확인)

### Primary Source
- 프로젝트 규칙의 1차 기준은 `CLAUDE.md`
- 아키텍처/패키지 구조: `.claude/skills/runnable-architecture/SKILL.md`
- 컴포넌트/UI: `.claude/skills/runnable-components/SKILL.md`
- Composable 분리: `.claude/skills/runnable-composables/SKILL.md`
- `AGENTS.md`와 `CLAUDE.md`가 충돌하면 `CLAUDE.md` 기준

### Working In This Directory
- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm lint` — ESLint 검사
- `pnpm typecheck` — TypeScript 타입 검사
- `pnpm seed` — DB 시드 데이터

### Quick Reference
| 변경 대상 | 위치 |
|-----------|------|
| 화면 조합 | `app/pages/`, `app/components/map/templates/` |
| 재사용 UI | `app/components/map/molecules/`, `app/components/map/organizations/` |
| 순수 계산 | `app/composables/action/` |
| 외부 API/브라우저 | `app/composables/sideeffect/` |
| 공유 상태 | `app/composables/store/` |
| CSS 토큰 | `app/assets/css/base/primitive.css`, `semantic.css` |
| API 엔드포인트 | `server/api/` |
| DB 스키마 | `server/database/schema/` |
| 공통 타입/스키마 | `shared/types/`, `shared/schemas/` |

## Dependencies

### External
- Nuxt 4 / Vue 3 — UI 프레임워크
- Cesium.js — 3D 지도 엔진
- Drizzle ORM + PostgreSQL — 데이터 저장
- better-auth — 인증
- TailwindCSS 4 + @nuxt/ui 4 — 스타일링
- Zod — 런타임 검증
- Tiptap — 리치 텍스트 에디터
- @unovis/vue — 차트 (고도 프로필)

<!-- MANUAL: -->
