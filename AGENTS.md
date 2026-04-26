<!-- Generated: 2026-04-10 | Updated: 2026-04-26 -->

# Runnable — AI Agent Guide

Cesium 3D 지도 위에서 러닝 경로를 제작·관리하는 풀스택 서비스.

## Primary Source

모든 프로젝트 규칙의 1차 기준은 [`CLAUDE.md`](CLAUDE.md).
`AGENTS.md`와 `CLAUDE.md`가 충돌하면 `CLAUDE.md` 기준.

## Quick Reference

| 변경 대상 | 위치 |
|-----------|------|
| 페이지 조합 | `app/pages/` |
| 도메인 엔티티 | `app/entities/{entity}/` (api, lib, model, ui) |
| 사용자 기능 | `app/features/{feature}/` (api, lib, model, ui) |
| 복합 위젯 | `app/widgets/{widget}/` |
| 공용 UI/유틸 | `app/shared/ui/`, `app/shared/lib/` |
| 순수 계산 | 각 슬라이스의 `lib/` |
| 부수 효과 | 각 슬라이스의 `api/` |
| 상태 관리 | 각 슬라이스의 `model/` |
| CSS 토큰 | `app/assets/css/base/primitive.css`, `semantic.css` |
| API 엔드포인트 | `server/api/` |
| DB 스키마 | `server/database/schema/` |
| 공통 타입/스키마 | `shared/types/`, `shared/schemas/` |

## Documentation

| 문서 | 설명 |
|------|------|
| [`CLAUDE.md`](CLAUDE.md) | 프로젝트 규칙, 아키텍처, composable 분리, CSS 토큰 |
| [`docs/README.md`](docs/README.md) | 문서 인덱스 — 기능 명세, 세션 기록, 인프라, 레퍼런스 |
| [`.claude/skills/`](.claude/skills/) | 반복 패턴의 구체적 구현 스킬 (16종) |
| [`.github/COMMIT_CONVENTION.md`](.github/COMMIT_CONVENTION.md) | 커밋 컨벤션 |

## Working In This Directory

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm lint` — ESLint 검사
- `pnpm typecheck` — TypeScript 타입 검사
- `pnpm seed` — DB 시드 데이터
