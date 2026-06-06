# 1. Overview

## 1.1 프로젝트 소개

Runnable 2.0은 러너를 위한 **경로 추천 · 시뮬레이션 · 기록 관리** 풀스택 애플리케이션입니다.

- 사용자가 시작점·목적지·선호 조건(난이도·거리·시설 등)을 입력하면 최적의 러닝 경로를 추천
- 3D 지도(Cesium)에서 경로를 시뮬레이션 재생
- 러닝 기록을 저장하고 통계로 시각화
- 다른 사용자의 경로 / 큐레이션 컬렉션을 발견·구독

## 1.2 기술 스택

| Layer           | 사용 기술                       | 비고                       |
| --------------- | ------------------------------- | -------------------------- |
| Framework       | Nuxt 4.3 + Vue 3                | SSR + Nitro 서버 통합      |
| UI              | @nuxt/ui 4 + TailwindCSS 4      | utility-first              |
| Map / 3D        | Cesium 1.140                    | terrain, entity, primitive |
| State           | useState composables + xstate 5 | 재생 상태머신              |
| API Schema      | Zod 4                           | 런타임 검증                |
| ORM             | Drizzle 0.45                    | PostgreSQL                 |
| Auth            | better-auth 1.4                 |                            |
| Test            | Vitest 4 + Playwright 1.60      | + @nuxt/test-utils         |
| Lint / Format   | ESLint 9 + Prettier             |                            |
| Package Manager | pnpm                            |                            |

## 1.3 Quick Start

```bash
pnpm install
pnpm dev                # 개발 서버 (포트 3001)
pnpm preview            # 프로덕션 프리뷰 (포트 3000)
pnpm test               # 유닛 테스트
pnpm test:e2e           # E2E 테스트
pnpm lint:fix           # 린트 + 자동 수정
pnpm typecheck          # 타입 체크
pnpm seed               # DB 시드 (개발)
```

상세 환경(포트·minikube·Tailscale)은 7. Operations 페이지 참고.

다음 → [2-Architecture](2-Architecture)
