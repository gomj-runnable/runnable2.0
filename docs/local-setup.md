# 실행방법

## E2E 스냅샷 테스트 (Playwright)

```bash
# 테스트 실행 (개발 서버 자동 시작)
pnpm test:e2e

# 스냅샷 baseline 갱신 (spec 변경 또는 UI 변경 후 실행)
pnpm test:e2e:update
```

> **참고**: spec 파일은 `tests/e2e/` 디렉터리에 위치한다. 현재는 기반 인프라만 구축된 상태이며, diagram-studio spec은 #126 완료 후 추가될 예정이다. 스냅샷 파일은 git에 포함시키고, 변경 시 PR 리뷰에서 확인한다.

## 도커 실행 (개발 DB)

루트 `docker-compose.yml` 이 개발용 PostGIS DB(`runnable_db`, `localhost:6432`)만 띄운다.
운영 형상은 `prod/compose/` 참조.

```bash
docker compose up -d db
```

## 개발 서버

```bash
cd /Users/kmj/WebstormProjects/Runnable
pnpm dev
```

## AI 팀 실행 (iTerm2 + zsh)

> tmux는 사용하지 않는다. Claude Code 네이티브 `/team`만 사용한다.

### 1. Claude Code 실행

iTerm2에서 프로젝트 루트로 이동 후 Claude Code를 실행한다.

```bash
cd /Users/kmj/WebstormProjects/Runnable
claude
```

### 2. 팀 시작

Claude Code 프롬프트 안에서 `/team` 명령을 입력한다.

```bash
# 기본 3-에이전트 팀 (Architect → Builder → Tester)
/team 3:executor "
[팀 공통 규칙]
- 모든 팀원은 공유된 '태스크 리스트'를 통해 작업 상태를 관리합니다.
- 팀원 간의 직접적인 협업이나 질문은 '메일박스'를 사용해 소통하십시오.

team A (architect):
- 사용자의 업무 요청을 분석하고 상세 기능을 설계하십시오.
- 설계가 완료되면 태스크 리스트를 업데이트하여 team B가 작업을 시작할 수 있게 하십시오.

team B (executor):
- team A가 작성한 설계를 바탕으로 실제 소스 코드를 구현하십시오.
- 구현 중 설계 오류나 기술적 제약 발견 시 메일박스로 team A에게 수정을 요청하십시오.
- 작업 완료 후 태스크 상태를 완료로 변경하여 team C에게 알리십시오.

team C (test-engineer):
- team B가 완료한 태스크를 가져가 품질 검증을 수행하십시오.
- 버그 발견 시 메일박스로 team B에게 즉시 피드백을 보내십시오.
"

# Ralph 래핑 (실패 시 자동 재시도 + 검증)
/team ralph "날씨 API 캐싱 최적화"

# 역할 지정
/team 2:debugger "빌드 에러 전체 수정"
/team 4:designer "반응형 레이아웃 구현"
```

### 3. 팀 모니터링

팀이 실행되면 리더(Lead)가 자동으로 파이프라인을 관리한다.
사용자가 개입하려면 Claude Code 프롬프트에서 직접 입력한다.

```
# 태스크 진행 확인
태스크 목록 보여줘

# 특정 워커에게 메시지 전달
worker-1에게 "sections.get.ts 수정 완료 후 알려줘" 전달해줘

# 팀 종료
팀 종료해줘
```

### 4. 병렬 세션 (선택)

여러 독립 작업을 동시에 하려면 iTerm2 패널을 분할한다.

| 단축키            | 동작      |
| ----------------- | --------- |
| `Cmd+D`           | 세로 분할 |
| `Cmd+Shift+D`     | 가로 분할 |
| `Cmd+[` / `Cmd+]` | 패널 전환 |
| `Cmd+T`           | 새 탭     |

각 패널에서 `claude`를 실행하면 독립 세션으로 작업할 수 있다.

```bash
# 패널 1: 팀 실행
claude
> /team 3:executor "경로 API 리팩터링"

# 패널 2: 별도 작업
claude
> CSS 토큰 정리해줘
```
