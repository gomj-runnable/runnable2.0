# 6. Testing & TDD

이 섹션은 Runnable 2.0의 **테스트 전략과 TDD 작업 규칙** 을 다룹니다.

| 페이지                                                | 내용                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| [6-1-TDD-Concepts](6-1-TDD-Concepts.md)               | TDD 개념과 기본 규칙 (Red-Green-Refactor, FIRST, 프로젝트 컨벤션) |
| [6-2-Test-Infrastructure](6-2-Test-Infrastructure.md) | 현재 테스트 인프라 (Vitest, Playwright, setup)                    |
| [6-3-Test-Writing-Guide](6-3-Test-Writing-Guide.md)   | 테스트 작성 패턴과 실전 예시                                      |
| [6-4-CI-Gate](6-4-CI-Gate.md)                         | CI 파이프라인의 테스트 게이트                                     |

## 빠른 요약

- **유닛 테스트** — `*.test.ts`, `__tests__/` 옆 디렉터리 패턴 (이미 20+ 디렉터리)
- **DB 통합 테스트** — `*.pglite.test.ts`, PGlite 임베디드 PostgreSQL
- **E2E** — `tests/e2e/*.spec.ts`, Playwright + dev 서버 자동 기동
- **사이클** — Red → Green → Refactor, 한 사이클 5분 이내 권장
- **순수 함수 우선** — 비즈니스 로직은 services 안에 순수 함수로 (의존성 주입)
