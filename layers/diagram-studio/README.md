# diagram-studio

Cesium 기반 러닝 경로 서비스의 아키텍처 다이어그램을 자동 생성하는 레이어.

## 생성 명령

```bash
# 1회 실행 후 종료
pnpm gen:diagrams

# 파일 변경 감지 시 자동 재생성 (watch 모드)
pnpm gen:diagrams:watch
```

## watch 모드 동작

- `app/`, `shared/`, `server/` 디렉토리와 `user-journey.yaml` 매니페스트를 감시
- `.ts`, `.tsx`, `.vue`, `.yaml`, `.yml` 파일 변경 감지 시 300ms 디바운스 후 재생성
- `Ctrl+C`로 깔끔하게 종료

## 출력

`public/diagrams/` 아래 4개 JSON 파일 생성:

| 파일 | 내용 |
|------|------|
| `fsd.json` | FSD 레이어 간 import 그래프 |
| `composables.json` | composable 의존 관계 |
| `classes.json` | 클래스 다이어그램 |
| `user-journey.json` | 유저 저니 매니페스트 |

## Analyzers

`scripts/analyzers/` 안의 4개 분석기가 각각 하나의 JSON을 담당:

- `fsd-graph.ts` — FSD 모듈 그래프
- `composable-graph.ts` — composable 그래프
- `class-diagram.ts` — 클래스 다이어그램
- `user-journey.ts` — 유저 저니
