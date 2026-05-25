# Runnable Documentation

프로젝트 문서 인덱스. 상위 문서에서 `[](docs/...)` 참조로 분기한다.

---

## Project Root

| 문서                           | 설명                                                  |
| ------------------------------ | ----------------------------------------------------- |
| [`../README.md`](../README.md) | 프로젝트 소개, 기술 스택, 설치 방법, API 엔드포인트   |
| [`../CLAUDE.md`](../CLAUDE.md) | AI 에이전트 규칙, 아키텍처, FSD 레이어 분리, CSS 토큰 |
| [`../AGENTS.md`](../AGENTS.md) | AI 에이전트 퀵 가이드 (CLAUDE.md 요약)                |

---

## Architecture

| 문서                            | 설명                                                                      |
| ------------------------------- | ------------------------------------------------------------------------- |
| [Frontend (FSD)](frontend.md)   | Feature-Sliced Design 레이어 구조, 세그먼트 규칙, Import 의존성, CSS 토큰 |
| [Backend (Layered)](backend.md) | Layered + Repository + Service 계층, 디자인 패턴, 에러 처리, 환경별 DI    |

---

## Feature Specs (기능 명세)

| 문서                                               | 기능                               |
| -------------------------------------------------- | ---------------------------------- |
| [경로 제작](feature/route-creation.md)             | Cesium 3D 지도 위 러닝 경로 그리기 |
| [경로 검색](feature/route-search.md)               | 공개 경로 검색, 미리보기           |
| [경로 시뮬레이션](feature/route-simulation.md)     | 3D 플라이스루 재생                 |
| [경로 피드백](feature/route-feedback.md)           | 구간 피드백 등록·조회, 공유 링크   |
| [경사도 시각화](feature/gradient-visualization.md) | 구간별 경사도 색상 폴리라인        |
| [날씨 정보](feature/weather-info.md)               | 서울 25개 구별 시간대별 날씨       |
| [날씨 기반 추천](feature/weather-recommend.md)     | AI 기반 날씨 적합 경로 추천        |
| [편의시설](feature/facility.md)                    | 주변 편의시설 표시, 유형별 필터    |
| [지역 탐색 (Discover)](feature/discover.md)        | 서울 구별 공개 경로 탐색           |
| [계정 관리](feature/account-management.md)         | 회원가입, 로그인, 세션 인증        |

---

## Infrastructure (인프라)

| 문서                                           | 설명                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| [docker-compose 운영](infra/docker-compose.md) | 단일 호스트 docker-compose 운영 가이드 (Jenkins/PostGIS/Nuxt 컨테이너) |
| [로컬 개발 설정](local-setup.md)               | Docker 실행, 개발 서버, AI 팀 운영 가이드                              |

---

## Reference (레퍼런스)

| 문서                                           | 설명                                      |
| ---------------------------------------------- | ----------------------------------------- |
| [디자인 패턴](design-pattern.md)               | 2026 Modern Design Patterns — 계층별 정리 |
| [Nuxt UI 통일 계획](nuxtui.md)                 | Nuxt UI 4 컴포넌트 전면 교체 진행 계획    |
| [커밋 컨벤션](../.github/COMMIT_CONVENTION.md) | type(unit): 설명 형식의 한글 커밋 규칙    |

---

## Session Logs (세션 기록)

작업 세션별 변경 기록. [`create-session-doc`](../.claude/skills/create-session-doc/SKILL.md) 스킬로 생성한다.

| 날짜       | 세션                                                                               | 주요 내용                          |
| ---------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| 2026-04-18 | [경사도 drawnPositions 통합](session/2026-04-18-gradient-drawnPositions-unify.md)  | drawnPositions 단일 진실 소스 구현 |
| 2026-04-18 | [경사도 폴리라인 교체](session/2026-04-18-gradient-polyline-replace.md)            | 폴리라인 렌더링 개선               |
| 2026-04-18 | [경사도 UI/섹션 수정](session/2026-04-18-gradient-ui-and-section-fix.md)           | UI 수정, 섹션 분할 로직            |
| 2026-04-18 | [시뮬레이션/카메라 리팩터링](session/2026-04-18-simulation-and-camera-refactor.md) | 카메라 로직 분리                   |
| 2026-04-19 | [아키텍처 개선](session/2026-04-19-architecture-improvement.md)                    | 전체 구조 개선                     |
| 2026-04-19 | [간단 이슈 일괄 수정](session/2026-04-19-easy-issues-batch-fix.md)                 | 다건 이슈 처리                     |
| 2026-04-19 | [지역 탐색 필터](session/2026-04-19-explore-district-filter.md)                    | Discover 기능 구현                 |
| 2026-04-19 | [경로 정보 기능](session/2026-04-19-route-info-feature.md)                         | 경로 상세 정보                     |
| 2026-04-20 | [DI 리팩터링](session/2026-04-20-di-refactoring.md)                                | 의존성 주입 패턴 적용              |
| 2026-04-20 | [간단 이슈 일괄 2차](session/2026-04-20-easy-issues-batch-2.md)                    | 다건 이슈 처리                     |
| 2026-04-20 | [보안/타입/접근성 일괄](session/2026-04-20-security-type-a11y-batch.md)            | 보안·타입·접근성 개선              |

---

## Claude Skills

`.claude/skills/` 디렉터리의 스킬 목록은 [`CLAUDE.md`](../CLAUDE.md)의 "현재 .claude Skill" 섹션을 참조한다.
