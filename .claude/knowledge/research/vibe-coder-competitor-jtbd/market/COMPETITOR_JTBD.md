# 경쟁사별 JTBD 리버스 엔지니어링

## 1. 바이브 코더 직접 검사

| 제품 | 고용 순간 | 입력 | 처리 | 즉시 결과 | 결제 경계 | 다음 행동 |
|---|---|---|---|---|---|---|
| [Vibe App Scanner](https://vibeappscanner.com/) | Lovable·Replit 등으로 배포했지만 무엇이 노출됐는지 모를 때 | 라이브 URL | 보안·DB/auth·성능·접근성·SEO·컴플라이언스 등 150+ 검사 | 무료 점수·이슈 수 | 전체 finding·fix는 $19/월, 로그인한 심층 검사·주간 모니터링은 $39/월 | 수정 프롬프트/MCP 적용 → 재검사 → Trust Badge |
| [Vibeproof](https://vibeproof.sh/) | 계정 연결 없이 공격자 관점의 빠른 검사를 원할 때 | URL, 선택적으로 repo | 무료 공개 표면 검사; 유료 Nuclei·testssl·Nikto·AI·git history 검사 | A–F 등급과 무료 수정 프롬프트 | 가입 없는 무료 검사, Deep scan $39/회 | 프롬프트를 코딩 에이전트에 붙여넣기 → 공유 가능한 보고서 |
| [VibeScan](https://www.lintvibe.com/) | AI가 작성한 소스의 반복적인 취약 패턴을 배포 전에 찾고 싶을 때 | 코드 붙여넣기, ZIP, GitHub repo | AST+regex 기반 41개 AI 특화 규칙 | 위험 점수·심각도·AI fix | 월 10회 무료, Pro €29/월, Team €99/월 | fix 적용 → PR webhook으로 반복 검사 |
| [VCEye](https://vibecodingeye.com/) | 에이전트가 “안전하다”고 답했지만 믿지 못할 때 | 공개 repo | OWASP·LLM 위험을 포함한 124개 패턴 | 무료 상위 2개 finding | 무료는 위치·수정 비공개, 유료는 파일·라인·diff·지속 검사 | diff 적용 또는 PR 자동 수정 → 매 commit 재검사 |
| [VibeCodeGarage](https://www.vibecodegarage.com/) | 자동 점수만으로 부족하고 출시 실패 비용이 클 때 | 앱·코드·감사 요청 | 사람이 보안·QA·UX·인프라·SEO·코드 품질을 2~3일 감사 | 우선순위가 붙은 보고서 | Quick scan 무료, Pre-launch $500, Comprehensive $1,500 | 수정 목록 실행 → 전문가 walkthrough |

### 이들이 공통으로 고용되는 JTBD

> AI가 만든 앱을 이미 배포했거나 배포하려 하지만 보안 지식이 없을 때, 무엇이 실제로 노출됐는지 쉬운 언어로 찾아내고 내 코딩 에이전트가 실행할 수정 방법을 줘서, 전문가가 되지 않고도 사고 없이 출시하고 싶다.

### 공통 제품 문법

```text
URL 또는 repo
→ 무료 불안 확인(점수·상위 이슈)
→ 결제로 세부 위치·수정 공개
→ 에이전트용 프롬프트·diff·PR
→ 재검사
→ 배지 또는 지속 모니터링
```

무료 검사는 가치 제공인 동시에 위험을 눈앞에 보여주는 획득 장치다. 실제 과금 지점은 `발견`보다 `정확한 위치`, `수정`, `검증`, `지속 감시`다.

## 2. 개발팀용 코드 검증·릴리스 게이트

| 제품 | 핵심 JTBD | 입력·처리 | 결과 | 결제·제약 |
|---|---|---|---|---|
| [CodeRabbit](https://docs.coderabbit.ai/overview/pull-request-review) | PR이 열렸을 때 사람 리뷰어가 놓칠 버그를 먼저 잡아 리뷰 시간을 줄이고 싶다 | repo·PR·이슈·팀 학습을 결합해 자동/증분 리뷰 | PR summary, inline finding, one-click fix, 대화 | 무료는 PR 요약 중심; Pro $24/개발자/월(연간), Pro+ $48 |
| [Greptile](https://www.greptile.com/) | diff만 보면 보이지 않는 코드베이스 맥락의 버그를 낮은 오탐으로 찾고 싶다 | 전체 코드베이스·규칙·외부 맥락으로 PR 리뷰 | 우선순위 finding과 review comment | 개인 50 credits 무료, Pro $30/seat/월, 초과 review $1 |
| [Qodo](https://docs.qodo.ai/code-review) | AI 코드가 조직 규칙·티켓 요구·과거 결정과 맞는지 일관되게 통제하고 싶다 | multi-agent review, repo·PR history·rule system | 중요 finding, relevance, remediation, 조직 analytics | 14일 trial 후 Pro Team $30, credit 방식; 상시 무료 tier 없음 |
| [SonarQube](https://docs.sonarsource.com/sonarqube-cloud/standards/quality-gates) | “이 PR을 합쳐도 되는가, 오늘 릴리스해도 되는가”를 조직 정책으로 자동 판정하고 싶다 | 정적 분석 결과를 quality gate 조건에 대입 | Passed/Failed gate와 PR decoration | 공개 프로젝트 무료; 사설·고급 분석은 Team/Enterprise |
| [Snyk](https://snyk.io/plans/) | 코드·오픈소스·컨테이너·IaC의 보안 위험을 개발 흐름 안에서 지속적으로 줄이고 싶다 | IDE·CLI·SCM에서 SAST/SCA/IaC/Container 검사 | 취약점·우선순위·fix 예시·거버넌스 | Free, Team $25/개발자/월부터, 상위는 demo/영업 |
| [Checkly](https://www.checklyhq.com/product/detect/) | 배포 뒤 로그인·결제 같은 핵심 흐름이 실제 사용자처럼 계속 작동하는지 먼저 알고 싶다 | Playwright/API/agentic check를 실제 브라우저·지역에서 반복 실행 | 실패 단계, screenshot·video·trace·alert·RCA | Hobby 무료; Starter $24/월, Team $64/월, agentic check 추가 $32/월 |

### 이 층의 JTBD 차이

- CodeRabbit·Greptile: **좋은 첫 번째 코드 리뷰어를 고용한다.**
- Qodo·SonarQube: **조직의 기준을 매번 동일하게 집행한다.**
- Snyk: **보안팀이 모든 코드를 직접 보지 않고 위험을 통제한다.**
- Checkly: **코드가 아니라 실제 사용자 여정이 살아 있는지 계속 확인한다.**

이 제품들은 정확하고 강력하지만 Git·PR·CI·Playwright 같은 개발 관습을 전제로 한다. 바이브 코더 직접 제품은 이 복잡성을 `URL 하나`, `점수`, `AI에게 붙여넣을 fix`로 번역한다.

## 3. 에이전트 작업 관제

| 제품 | 고용 순간 | 입력·처리 | 결과 | 결제·제약 |
|---|---|---|---|---|
| [Conductor](https://www.conductor.build/) | Claude Code·Codex·Cursor 작업을 병렬로 돌리되 파일 충돌을 피하고 싶을 때 | repo를 worktree별 workspace·branch·terminal·agent session으로 격리 | agent 상태, diff, checks, PR, merge/archive 경로 | 현재 무료, macOS 전용, 모델 비용은 공급자 계정; 로컬 사용자 권한으로 실행 |
| [GitHub Copilot Agents](https://github.com/features/copilot/agents) | backlog issue를 여러 agent에게 맡기고 GitHub 안에서 PR로 회수하고 싶을 때 | issue·대화·Jira/Linear 맥락 → Copilot/Claude/Codex 실행 | unified task view, session log, draft PR, CI·review fix, agent merge | Copilot Pro $10/월부터; agent task는 Actions minutes와 AI credits 사용 |
| [Cursor Background Agents](https://docs.cursor.com/background-agent) | IDE를 떠나도 cloud agent가 repo 작업을 계속하게 하고 싶을 때 | GitHub read-write 권한, AWS 격리 VM에서 agent 실행 | sidebar의 agent 목록과 변경 결과 | 유료 Cursor plan과 모델 API 사용량; 초기 spend limit 설정, cloud 실행·인터넷 접근 위험 |

### 공통 JTBD

> 여러 코딩 에이전트에게 동시에 일을 맡길 때 작업을 서로 격리하고 상태와 결과를 한곳에서 회수해서, 속도를 높여도 충돌·재작업·통제 상실을 피하고 싶다.

`agent 목록을 보여주는 dashboard`만으로는 차별화되지 않는다. Conductor는 worktree 격리에서 PR 회수까지 연결하고, GitHub는 issue·CI·review·merge를 이미 하나의 작업 흐름으로 묶고 있다.

## 4. 경쟁사 JTBD의 계층

| 사용자가 말하는 요청 | 더 깊은 JTBD | 대표 제품 |
|---|---|---|
| 내 앱을 스캔해줘 | 내가 모르는 위험을 눈에 보이게 해줘 | Vibeproof, VibeScan |
| 어떻게 고쳐야 해? | 전문 용어를 내 에이전트가 실행할 명령으로 번역해줘 | VAS, VCEye |
| 이제 안전한가? | 수정 전후를 다시 시험해 책임 있게 출시하게 해줘 | VAS, SonarQube |
| 계속 괜찮은가? | 코드가 바뀌어도 핵심 위험과 사용자 흐름을 감시해줘 | VAS Pro, Checkly |
| 다른 사람에게 증명하고 싶어 | 내 결과물이 AI slop이 아니라는 신뢰 증거를 줘 | VAS Trust Badge, Vibeproof report |
| 에이전트를 더 쓰고 싶어 | 위임해도 통제권과 검증 책임은 유지하게 해줘 | Conductor, GitHub Copilot |

