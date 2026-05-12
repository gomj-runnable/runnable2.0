# TODO-mermaid: JSON → Mermaid 변환 규칙

각 다이어그램 JSON의 구조를 분석하고 Mermaid 변환 규칙을 문서화한다.

---

## 공통 구조

모든 JSON은 `DiagramJSON` 타입을 따른다:

```
{
  kind: TabKind,
  nodes: Array<{ id, label, group?, kind?, data? }>,
  edges: Array<{ id, source, target, kind }>,
  meta: { generatedAt, sourceCommit, nodeCount, edgeCount }
}
```

---

## 1. fsd.json (21 nodes, 48 edges)

**Mermaid 타입:** `graph TD` (위→아래, FSD 레이어 계층 표현)

**노드 그룹:**
| group     | 노드 수 |
|-----------|--------|
| widgets   | 3      |
| features  | 8      |
| entities  | 7      |
| shared    | 3      |

**변환 규칙:**
- 각 group → `subgraph <group>` 블록
- node.id에 `/`, `-` 포함 → `_`로 치환 (Mermaid ID 제약)
- 노드 표기: `safe_id["원본/id"]`
- 엣지: `source --> target` (kind는 모두 "imports"이므로 단일 화살표)

**주의:** `widgets/map-shell`처럼 슬래시가 있어 ID 변환 필수

---

## 2. user-journey.json (6 nodes, 5 edges)

**Mermaid 타입:** `journey` (유저 저니 전용 다이어그램)

**노드 목록 (순서 중요):**
1. 앱 진입 (enter)
2. 로그인 (auth)
3. 지도 진입 (map)
4. 경로 그리기 (draw)
5. 경로 저장 (save)
6. 경로 공유 (share)

**변환 규칙:**
- `journey` 헤더
- `title 러닝 경로 서비스 유저 저니`
- `section 메인 플로우`
- 각 노드 → `<label>: 5: User` (점수 5 = 긍정적 경험)
- 엣지는 `journey` 다이어그램에서 순서로 표현됨 (별도 화살표 불필요)

---

## 3. composables.json (58 nodes, 68 edges)

**Mermaid 타입:** `graph LR` (좌→우, 의존성 방향)

**노드 kind 분포:**
| kind        | 노드 수 |
|-------------|--------|
| facade      | 4      |
| store       | 24     |
| lib         | 5      |
| sideeffect  | 18     |
| (기타)       | 7      |

**변환 규칙:**
- 각 kind → `subgraph <kind>` 블록
- node.id는 camelCase (특수문자 없음) → 그대로 사용
- 엣지: `source --> target` (kind는 모두 "calls")
- 노드 수가 많아 `graph LR`이 좌우 흐름으로 더 읽기 좋음

**분할 검토:** 58 nodes는 한 다이어그램에 표시 가능 (mmdc 기본 지원)

---

## 4. classes.json (124 nodes, 145 edges)

**Mermaid 타입:** `graph TD` (서브그래프로 그룹 분리)

**노드 group 분포:**
| group    | 노드 수 |
|----------|--------|
| types    | 81     |
| schemas  | 27     |
| services | 16     |

**변환 규칙:**
- 각 group → `subgraph <group>` 블록
- node.id에 `-`, `.` 포함 가능 → `_`로 치환
- 엣지 kind 매핑:
  - `"extends"` → ` --|> ` (상속 화살표)
  - `"uses"` → ` --> ` (일반 화살표)

**분할 검토:** 124 nodes는 mmdc로 처리 가능하나 SVG가 클 수 있음.
단일 파일로 먼저 생성 후, 필요시 group별로 분리 검토.

---

## 출력 파일 목록

| 입력                      | .mmd 출력                    | .md 출력 (wrapper)          |
|---------------------------|------------------------------|------------------------------|
| public/diagrams/fsd.json  | docs/diagrams/fsd.mmd        | docs/diagrams/fsd.md         |
| public/diagrams/user-journey.json | docs/diagrams/user-journey.mmd | docs/diagrams/user-journey.md |
| public/diagrams/composables.json | docs/diagrams/composables.mmd | docs/diagrams/composables.md |
| public/diagrams/classes.json | docs/diagrams/classes.mmd   | docs/diagrams/classes.md     |

---

## 검증 명령

```bash
# 변환 실행
pnpm gen:mermaid

# 개별 SVG 렌더 확인 (mmdc)
npx mmdc -i docs/diagrams/fsd.mmd -o /tmp/fsd.svg
npx mmdc -i docs/diagrams/user-journey.mmd -o /tmp/user-journey.svg
npx mmdc -i docs/diagrams/composables.mmd -o /tmp/composables.svg
npx mmdc -i docs/diagrams/classes.mmd -o /tmp/classes.svg
```
