# 교육 퀴즈 정답 키 (채점용)

> ⚠️ 학습자 비공개 — 채점할 때만 참조하는 정답 키.
> 사용자가 채팅에 `@{page} 답: 1-?, 2-?, 3-?, 4-?` 형식으로 제출하면 아래와 대조한다.
> **4문항 전부 정답일 때만** `HOME.html` 진도 표의 해당 `.prog-item` 을 완료 처리한다.

## 완료 처리 방법

`HOME.html` 에서 해당 페이지의 항목을 찾아 두 곳을 수정:

```html
<!-- 미완료 -->
<div class="prog-item" data-page="02-architecture">
    <span class="pname">02 구조</span><span class="pstat">미완료</span>
</div>
<!-- 완료 (class 에 done 추가 + pstat 텍스트 교체) -->
<div class="prog-item done" data-page="02-architecture">
    <span class="pname">02 구조</span><span class="pstat">완료 ✓ 2026-06-21</span>
</div>
```

날짜는 채점 시점의 실제 날짜로 적는다.

---

## 플러그인 트랙

| page                  | 1   | 2   | 3   | 4   |
| --------------------- | --- | --- | --- | --- |
| `@00-vision`          | b   | c   | b   | b   |
| `@01-prerequisites`   | b   | c   | b   | c   |
| `@02-architecture`    | b   | c   | a   | d   |
| `@03-evolution`       | b   | b   | b   | c   |
| `@04-roadmap`         | b   | c   | a   | c   |
| `@05-on-demand`       | b   | a   | b   | b   |
| `@06-limits`          | b   | c   | a   | b   |
| `@07-log`             | b   | b   | a   | b   |
| `@08-server-platform` | b   | b   | c   | c   |

## 프론트엔드 강의 트랙

| page                      | 1   | 2   | 3   | 4   |
| ------------------------- | --- | --- | --- | --- |
| `@fe-01-reactivity`       | b   | c   | a   | b   |
| `@fe-02-mvvm`             | c   | b   | a   | b   |
| `@fe-03-state-sideeffect` | b   | c   | b   | c   |
| `@fe-04-vue-vs-react`     | b   | b   | c   | b   |

---

## 출제 근거 요약

- **00-vision**: 1)메인페이지=내가 조립한 결과 2)희소한 쪽=판 만드는 개발자 3)판(host)이 토대 4)plugins-ext=지금 만질 수 있는 최소 형태
- **01-prerequisites**: 1)메인스레드 막히면 화면 버벅임 2)동적 import()=설치의 정체 3)defineAsyncComponent=렌더 시점 로드 4)FSD 단방향 의존(역방향·교차 금지)
- **02-architecture**: 1)pages→…→shared 단방향 2)조합은 widget facade에서 3)api/=use\*Sideeffect(외부호출+store동기화) 4)lib/=순수 로직(부수효과 없음)
- **03-evolution**: 1)Gen4=원격·분산 독립배포 2)신뢰모델=능력 단위 허가 3)Figma=메인스레드 샌드박스+UI iframe 4)plugins-ext=Gen 1.5
- **04-roadmap**: 1)각 레벨 gate(통과 기준) 2)L1=앵커 chip 플러그인 3)L3=PluginContext/주입형 SDK 4)과설계 경계=YAGNI
- **05-on-demand**: 1)설치=동적 import 첫 호출 2)정적 import 제거가 핵심 3)install ON→computed→defineAsyncComponent 첫 렌더 fetch 4)모듈 코드는 캐시에 남음(진짜 0비용은 설치 전)
- **06-limits**: 1)7개 구조적 벽 2)벽6 경제적 역인센티브=코드로 못 푸는 벽 3)단일 벤더로 좁히면 오늘 가능 4)plugins-ext=Gen 1.5, 지금은 넘을 필요 없음
- **07-log**: 1)채워 가는 문서 2)box에 done 클래스로 체크 3)템플릿 복사해 최신을 위로 4)프론트 L1~L4 + 서버 S1~S4 두 트랙
- **08-server-platform**: 1)GIS 서버=두 번째 훈련장(확장 구조) 2)S2=코어 안 건드리고 확장 추가 3)SPI↔PluginManifest 다리 4)확장점 과설계 경계=YAGNI
- **fe-01-reactivity**: 1)명령형=데이터·화면 이중관리 2)computed=파생+캐싱 3)watch=부수효과 4)sideeffect watch가 마커 재렌더
- **fe-02-mvvm**: 1)ViewModel=주방(손질) 2)차이=바인딩(자동 갱신) 3)뿌리=2005 WPF 4)useRouteInfoStore=ViewModel 그 자체
- **fe-03-state-sideeffect**: 1)store=순수 상태 2)$fetch·렌더·watch=sideeffect 3)ViewModel state=model store 4)store는 직접 안 그림(watch→render)
- **fe-04-vue-vs-react**: 1)기준=반응형 양방향 바인딩 채택 여부 2)React=단방향(MVVM 아님) 3)반응형 바인딩 공통조상 가문 4)Vue라 바인딩이 동기화 책임
