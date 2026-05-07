# TODO — diagram-studio 검수 항목

> 1차 구현(T1~T7)은 끝났다. 이 문서에는 **사용자가 직접 결정·점검해야 할 항목만** 남긴다.

## A. 결정이 필요한 사항

### A-1. 로그인 ID 형식 — 어떻게 가시겠어요?
- 사용자 명시: `id: developer` / `password: developer1234`
- 현재 구현: better-auth가 email-only라 **email = `developer@runnable.com`** 로 저장됨
- 옵션:
  - **(A) 그대로 유지** — 로그인 시 `developer@runnable.com` 입력 (간단, 추가 작업 없음)
  - (B) better-auth `username` 플러그인 도입 — 의존성/스키마 마이그레이션 발생
  - (C) email 컬럼에 'developer' 문자열 저장 — better-auth 검증 우회 필요(권장 안 함)

→ 답해주시면 바로 반영합니다.

### A-2. 시드 패스워드 평문 하드코딩
- `server/database/seed.ts`, `server/utils/memoryStore.ts`에 `developer1234` 평문.
- dev 환경 한정이지만 환경변수(`DEVELOPER_SEED_PASSWORD`)로 분리할까요?

### A-3. role 정수 컨벤션
- 현재 `99 = developer` 임의 지정. 향후 admin 등 추가 시 충돌 위험.
- `shared/constants/roles.ts` 같은 단일 진실 공급원을 만들지 결정 필요.

---

## B. 사용자가 직접 확인해야 할 동작 체크리스트

수동 점검(dev 서버 띄워서 확인). 자동 검증은 모두 통과한 상태.

- [ ] `pnpm dev` 시동 → 콘솔 에러 없음
- [ ] **production DB 모드에서**: 비로그인으로 `/admin/diagrams` 접근 → `/`로 리다이렉트
- [ ] developer 계정으로 로그인 (`developer@runnable.com` / `developer1234`) → `/admin/diagrams` 진입 가능
- [ ] 4탭(User Journey / FSD Layers / Composable Graph / Class Diagrams) 표시 확인
- [ ] 키보드 1/2/3/4 → 탭 전환 동작
- [ ] `/` 키 → 검색 input 포커스
- [ ] 검색어 입력 시 노드 highlight + zoom-to-fit 동작
- [ ] 노드 클릭 → 우측 NodeDetailPanel 표시. data/메타가 충분히 의미 있는지 점검
- [ ] DiagramLegend의 그룹 필터 토글이 노드를 실제로 숨기는지 (특히 classes 탭 124노드 노이즈)
- [ ] 디자인 인상 — "Terminal Graph" 미학(JetBrains Mono + 격자 오버레이 + #00d4a8/#ff6b35)이 의도와 맞는지

> ⚠️ **MEMORY 모드는 검증 불가.** root@runnable.com 자동 로그인이 항상 동작해 비로그인 상태가 사실상 존재하지 않습니다. 권한 가드 검증은 production DB 모드에서만 가능합니다.

---

## C. 알아두실 사항 (수정은 필요시)

- **pre-existing 타입 에러**: `shared/types/__tests__/weather-layer.enum.test.ts:65` pm25 — 커밋 `07ade12` 이후 누적. diagram-studio 작업과 무관하나 typecheck CI가 있다면 별도 처리 필요.
- **codegen 분석은 정규식 기반**: ts-morph 대신 정규식만 사용(Cesium d.ts 무게 회피). 동적 `import('...')`, 재export, alias 호출은 누락 가능. 그래프가 충분히 정확한지 production 데이터로 한 번 훑어보시면 좋습니다.
- **prebuild 실패 시 빌드 전체 실패**: codegen 예외 시 fallback 없음. CI에서 한 번 깨지면 전체 배포가 막힙니다.

---

## D. 미실행/미검증 (필요 시 확장)

- codegen analyzer 단위 테스트 없음 (회귀 위험)
- dev 모드 watch 미지원 (코드 변경 → 다이어그램 즉시 반영 안 됨; 빌드타임만)
- layer를 다른 Nuxt 프로젝트에 옮겨서 실제 재사용 가능한지 sandbox 검증 미실행
- manifest YAML zod 스키마 검증 없음 (잘못된 형식이면 codegen 런타임 에러)

---

## E. 다음 단계 제안

1. **A-1 답변 → 즉시 반영**
2. dev 서버 띄워 §B 체크리스트 점검
3. 결과 공유 → 발견된 결함 fix 또는 commit & PR

> 수정이 필요한 항목을 알려주시면 그 부분만 작업합니다.
