---
name: tailscale-funnel
description: macOS(맥미니 포함)에서 Tailscale Funnel을 사용해 로컬 포트를 외부 인터넷에 HTTPS로 노출하거나 종료하는 방법. 사용자가 "tailscale funnel", "퍼널", "외부 노출", "localhost 외부 공개", "내 서버를 인터넷에 공개", "포트 노출 끄기", "tailscale command not found", "BundleIdentifiers.swift Fatal error", "trace trap" 같은 표현을 쓸 때 반드시 이 스킬을 사용한다. macOS 공식 .pkg 버전(macsys)에서 CLI가 PATH에 없거나, 앱 번들 바이너리를 직접 호출했을 때 발생하는 BundleIdentifiers 크래시까지 함께 해결한다. 포트포워딩이나 Cloudflare Tunnel 대신 Tailscale로 외부 노출을 하려는 모든 상황에 적용한다.
---

# Tailscale Funnel 켜고 끄기 (macOS)

맥미니의 로컬 포트(예: `localhost:3000`)를 공인 HTTPS URL로 외부 인터넷에 노출하는 절차. Tailscale이 설치되지 않은 사람도 일반 브라우저로 접속할 수 있다.

기본 시나리오는 **로컬 3000 포트를 외부 443 포트로 백그라운드 노출**이며, 다른 포트는 명령어에서 숫자만 바꾸면 된다.

## 0. CLI 설치 (최초 1회)

macOS 공식 .pkg 버전(macsys)으로 Tailscale을 설치하면 GUI 앱은 동작하지만 CLI 명령어는 따로 설치해야 한다. 앱 번들 안의 `/Applications/Tailscale.app/Contents/MacOS/Tailscale`을 심볼릭 링크로 등록하면 동작하지 않는다 — 이 파일은 GUI 앱 메인 바이너리라서 CLI로 호출하면 `BundleIdentifiers.swift Fatal error / trace trap` 크래시가 난다.

**올바른 방법: Homebrew로 CLI formula 설치**

GUI 앱(macsys)은 그대로 두고 CLI만 Homebrew로 별도 설치한다. 둘은 같은 데몬을 공유하므로 충돌 없이 함께 동작한다.

```bash
# 잘못 만든 심볼릭 링크가 있다면 먼저 제거
sudo rm -f /usr/local/bin/tailscale

# CLI formula 설치 (--cask 아님, GUI 앱은 이미 있으므로)
brew install tailscale
```

**설치 확인**

```bash
which tailscale       # /opt/homebrew/bin/tailscale 또는 /usr/local/bin/tailscale
tailscale version     # 버전 정보 출력
tailscale status      # 본인 Tailnet 정보 출력 (GUI 앱이 켜져 있어야 함)
```

세 명령 모두 정상 출력되면 완료. `tailscale status`가 동작한다는 건 CLI가 macsys GUI의 데몬과 잘 통신하고 있다는 뜻이다.

**Homebrew가 없다면**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 안내되는 PATH 설정 명령(Apple Silicon은 `eval "$(/opt/homebrew/bin/brew shellenv)"`, Intel은 `/usr/local/bin/brew shellenv`)을 `~/.zshrc`에 추가하고 새 터미널 열기.

## 1. 사전 체크리스트

Funnel 명령 실행 전에 아래 세 가지가 모두 만족되어야 한다. 하나라도 누락되면 권한 에러나 인증서 에러가 난다.

**ACL에 Funnel 권한 추가**

[login.tailscale.com/admin/acls/file](https://login.tailscale.com/admin/acls/file)에서 Tailnet policy file을 열고 `nodeAttrs` 섹션을 추가한다. 이미 있으면 `funnel` 속성만 추가.

```json
{
  "acls": [
    {"action": "accept", "src": ["*"], "dst": ["*:*"]}
  ],
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr":   ["funnel"]
    }
  ]
}
```

저장 후 Save 클릭. JSON 문법 오류 있으면 빨간 메시지가 뜬다.

**DNS 설정 활성화**

관리자 페이지의 DNS 탭에서:
- **MagicDNS** — Enable
- **HTTPS Certificates** — Enable

둘 다 켜져 있어야 Funnel이 인증서를 자동 발급받는다.

**노출하려는 서비스가 실제로 돌고 있어야 함**

`localhost:3000`에 접속했을 때 응답이 와야 한다. Funnel은 단순 리버스 프록시이므로, 뒤에 서비스가 없으면 502 에러가 난다.

```bash
curl http://localhost:3000
```

## 2. Funnel 켜기

**기본 명령 (로컬 3000 → 외부 443, 백그라운드)**

```bash
sudo tailscale funnel --bg --https=443 localhost:3000
```

또는 더 짧게(443은 기본값이라 생략 가능):

```bash
sudo tailscale funnel --bg 3000
```

`--bg`는 백그라운드 실행이라 터미널을 닫아도 계속 돌아가고 재부팅 시 자동 재시작된다.

**다른 포트로 노출하고 싶을 때**

외부 포트는 **443, 8443, 10000** 셋 중 하나만 가능하다. Tailscale의 제약이며, 임의 포트는 쓸 수 없다. 내부 포트는 자유.

```bash
# 외부 8443 → 내부 3000
sudo tailscale funnel --bg --https=8443 localhost:3000

# 외부 443 → 내부 8080
sudo tailscale funnel --bg --https=443 localhost:8080
```

**포그라운드 실행 (테스트·디버깅용)**

```bash
sudo tailscale funnel 3000
```

`--bg` 없이 실행하면 터미널이 그 자리에 묶이고 Ctrl+C로 종료된다. 로그가 실시간으로 보이므로 문제 진단에 적합. 운영용으로는 부적합.

## 3. 상태 확인

```bash
tailscale funnel status
```

성공 시 출력 예:

```
# Funnel on:
#     - https://mac-mini.본인테일넷.ts.net (Funnel on)
#         |-- / proxy http://127.0.0.1:3000
```

이 URL을 외부 누구에게나 공유하면 된다. Tailscale 미설치 기기에서도 일반 브라우저로 접속 가능.

## 4. Funnel 끄기

**특정 포트만 끄기**

```bash
sudo tailscale funnel --https=443 off
```

켤 때 사용한 외부 포트 번호와 동일하게 `--https=` 값을 지정해야 한다. 8443으로 켰으면 `--https=8443 off`.

**모든 Funnel 한 번에 끄기**

```bash
tailscale funnel reset
```

여러 포트를 동시에 노출 중일 때 한 번에 정리할 수 있다.

**종료 확인**

```bash
tailscale funnel status
# "No Funnel configuration"이 뜨면 모두 종료된 상태
```

## 5. 자주 만나는 에러

**`BundleIdentifiers.swift:41: Fatal error` / `trace trap`**
앱 번들 메인 바이너리(`/Applications/Tailscale.app/Contents/MacOS/Tailscale`)를 직접 또는 심볼릭 링크로 호출했을 때 발생. 이 파일은 GUI 앱 진입점이라 CLI로 부르면 안 된다. 섹션 0의 Homebrew 방식으로 CLI를 별도 설치할 것. 잘못된 심볼릭 링크가 있다면 `sudo rm /usr/local/bin/tailscale` 후 `brew install tailscale`.

**`tailscale: command not found`**
CLI가 설치되지 않았거나 PATH에 없는 상태. 섹션 0 진행. 설치 직후 같은 에러면 새 터미널 창 열거나 `hash -r`.

**`funnel not allowed`**
ACL의 `nodeAttrs`에 `funnel` 권한이 없거나, target이 본인 계정을 포함하지 않는다. 사전 체크리스트의 ACL 항목 다시 확인.

**`HTTPS must be enabled`**
DNS 탭에서 HTTPS Certificates가 꺼져 있다. 사전 체크리스트의 DNS 항목 확인.

**브라우저에서 502 Bad Gateway**
Funnel 자체는 정상이지만 뒤의 서비스가 응답하지 않는다. `curl http://localhost:3000`으로 로컬 서비스가 살아있는지 먼저 확인.

**브라우저에서 접속 불가 / 무한 로딩**
맥미니가 잠자기 모드로 들어갔을 가능성이 높다. 시스템 설정 → 에너지에서 "디스플레이가 꺼졌을 때 자동으로 잠자지 않기" 체크.

## 6. 운영 시 주의사항

`--bg`로 켜둔 Funnel은 맥미니가 켜져 있는 한 계속 외부에 노출된다. 더 이상 공개할 필요가 없으면 반드시 `funnel reset` 또는 `--https=443 off`로 명시적으로 종료할 것. 끄지 않으면 재부팅 후에도 자동으로 다시 노출된다.

Funnel URL은 인터넷 누구나 접근 가능하므로, 인증 없는 관리 페이지나 민감한 데이터를 노출 중인 포트는 절대 Funnel로 공개하지 말 것. 노출할 서비스 자체에 인증을 붙이거나, Tailscale 네트워크 내부에서만 접근하게 하려면 `tailscale serve`(funnel 대신)를 사용.

GUI 앱(macsys)과 Homebrew CLI를 함께 쓰는 구성에서는, GUI 앱이 종료된 상태(메뉴 막대 아이콘 사라짐)에서는 CLI 명령도 `Tailscale daemon is not running` 에러가 난다. GUI 앱이 항상 실행 중이어야 한다.
