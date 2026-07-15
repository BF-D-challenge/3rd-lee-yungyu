# TASK 2 최종 — 8,406개 필터 실험

작성일: 2026-07-13

## 한 줄 결론

8,406개를 7가지 방법으로 모두 점수화한 뒤 각 6개를 직접 검수했다. 무작위보다 나았던 두 방법을 30개씩 넓히자 정밀검사 후보는 60칸 중 7칸, 중복 제거 시 실제 5개만 남았다. 따라서 필터는 합격 판정기가 아니라 사람이 볼 순서를 정하는 도구로만 사용한다.

## As-Is → To-Be

| 구분 | As-Is | To-Be | 확인 결과 |
|---|---|---|---|
| 검토 순서 | 8,406개를 같은 순서로 읽음 | 먼저 볼 가능성이 높은 줄부터 정렬 | 즉시 결과 필터가 가장 나았지만 30개 중 4개뿐 |
| 자동 판정 | 점수 높으면 좋은 아이디어처럼 보임 | 점수는 후보 추천만 하고 사람이 하드게이트 판정 | 기본 기능·범용 AI·플랫폼 종속이 상위에도 다수 등장 |
| 경쟁 앱 | 경쟁 제품이 있으면 실패로 오해 가능 | 경쟁 존재는 실패 이유가 아님 | 입력·결과·MVP·한국 순간이 좋으면 후보로 유지 |
| 다음 단계 | 필터를 계속 새로 만듦 | 두 필터로 검토 순서만 만들고 필터 실험 종료 | TASK의 중단 조건을 충족 |

## 확장 실험 결과

| 방법 | 처음 6개 | 확장 30개 | Merge | 조건부 보류 | 탈락 | 무작위 6개 대비 |
|---|---:|---:|---:|---:|---:|---:|
| A_immediate_result — 현재 페이지·설치 직후 결과 | 2/6 | 4/30 | 1/30 | 1/30 | 24/30 | +13.3%p |
| D_pass_near_fail_far — 현재 좋은 원본과 가깝고 Fail과 멀기 | 2/6 | 3/30 | 3/30 | 8/30 | 16/30 | +10.0%p |

무작위 대조군은 0/6이었다. 표본이 작아 통계적 승리로 부르지는 않는다. 다만 두 방법 모두 무작위보다 먼저 볼 후보를 더 찾았고, 6개 실험의 33.3%가 30개 확장에서 13.3%·10.0%로 내려간 사실도 함께 기록한다.

## 실제로 남은 5개 원본

| 원본 | 실제 입력 → 결과 | 왜 남았나 | 발견 필터 |
|---|---|---|---|
| VlogMap – Extract and map locations from videos & reels | 여행 영상 URL → 장소·시점이 표시된 지도와 경로 | 문제가 생긴 뒤 공개 URL만 넣어 바로 시작할 수 있다. | A_immediate_result |
| SEO Analyzer: One-Click Website Audit | 웹사이트 URL → SEO 누락 항목과 고칠 목록 | 현재 페이지 하나로 즉시 결과가 나오고 작은 MVP가 가능하다. | A_immediate_result, D_pass_near_fail_far |
| Schema Markup Validator & Generator | 웹사이트 URL → 구조화 데이터 오류와 수정 JSON-LD | 오류 위치·미리보기·수정 결과가 구체적이다. | A_immediate_result, D_pass_near_fail_far |
| IBM Equal Access Accessibility Checker | 웹사이트 URL → 접근성 오류 위치·기준·수정 문장 | 검사 규칙이 명확하고 문제 뒤 URL만으로 시작할 수 있다. | A_immediate_result |
| Data Scraper - AI Data Miner | 현재 웹페이지와 고른 항목 → 정리된 CSV | 한 페이지 권한과 한 번의 내보내기로 세로 조각이 닫힌다. | D_pass_near_fail_far |

두 필터가 SEO Analyzer와 Schema Markup Validator를 함께 잡아 7칸이 5개 원본으로 줄었다. 이 5개는 앱 승격이 아니라 결제자 3 × 순간 3 × 한 끗 3의 27조합 정밀감사를 받을 후보군이다.

## 원본 60칸 전체 판정

### A_immediate_result — 현재 페이지·설치 직후 결과

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | PerfectPost: makes Linkedin 10x better | 탈락 | LinkedIn 글쓰기 개선이라는 설명만 있고 고유 입력·검사 기준·소유 결과가 없다. |
| 2 | VlogMap – Extract and map locations from videos & reels | 정밀검사 후보 | 공개 여행 영상 URL→장소·시점 추출→지도·경로는 문제 뒤 바로 시작하고 결과가 선명하다. |
| 3 | Loom – Screen Recorder & Screen Capture | 탈락 | 화면·카메라 녹화와 공유 전체 제품이며 한 작업으로 좁힌 새 원본이 아니다. |
| 4 | Profile Scraper for LinkedIn™ | 탈락 | LinkedIn 검색 결과 대량 수집은 플랫폼 정책과 DOM 변화에 핵심 가치가 종속된다. |
| 5 | Extract WA Group & Contact Links - WhatsApp Link Scraper | 탈락 | WhatsApp 초대·연락처 링크 대량 수집은 플랫폼 정책과 스팸성 리드 수집 위험이 크다. |
| 6 | SEO Analyzer: One-Click Website Audit | 정밀검사 후보 | 현재 공개 URL→제목·태그·링크·헤딩 누락표는 즉시 작동하고 1~2일 세로 조각으로 줄일 수 있다. |
| 7 | Socials - Generate Posts in One Click | 탈락 | X·LinkedIn 글을 AI로 만들어주는 범용 생성 기능이라 고유한 검사 기준이나 소유 결과가 없다. |
| 8 | Schema Markup Validator & Generator | 정밀검사 후보 | 현재 URL→Schema.org 구조화 데이터 오류·미리보기·수정 JSON-LD는 즉시 결과가 생기는 좁은 작업이다. |
| 9 | Google Flights Price Hacker – Save More! | 탈락 | 더 싼 항공권이라는 결과가 외부 항공 재고·가격 비교와 제휴 링크에 의존해 1인 세로 조각이 아니다. |
| 10 | TTS Reader | 탈락 | 웹페이지·PDF 읽어주기는 브라우저와 OS의 기본 읽어주기보다 더 좁은 고유 결과가 없다. |
| 11 | YouTube Row Fixer | 탈락 | 유튜브 한 줄당 영상 수 조정은 즉시 작동하지만 반복 통증과 자연스러운 결제자 3개가 없다. |
| 12 | Click&Clean | 탈락 | 쿠키·캐시·방문 기록 삭제는 브라우저 설정과 기본 단축 동작이 더 직접적이다. |
| 13 | Music Stream Links | 탈락 | 무료 음악 링크 확장이라는 설명만 있어 입력·처리·결과와 결제 순간을 판단할 수 없다. |
| 14 | Live NBA Scores & Stats - GameDash | 탈락 | NBA 실시간 점수·하이라이트는 스포츠 데이터 피드와 콘텐츠 권리에 핵심 결과가 종속된다. |
| 15 | WeatherNow – Hourly & Weekly Forecast | 탈락 | 날씨·미세먼지·시간별 예보는 OS 날씨와 검색이 이미 같은 결과를 더 직접적으로 준다. |
| 16 | LinkedIn Extension | 탈락 | LinkedIn 알림 숫자를 다시 보여주는 기능은 원 플랫폼 알림보다 좁은 고유 결과가 없다. |
| 17 | Genie by Groupon | 탈락 | 검증된 쿠폰 결과는 사용자가 필요한 순간보다 먼저 상점별 코드 재고를 계속 수집·검증해야 한다. |
| 18 | SeoVeda Meta Tracker – SEO Metadata & On-Page SEO Auditor | Merge 재료 | 현재 페이지의 메타·헤딩·링크·구조화 데이터를 검사하는 항목을 SEO Analyzer 카드 재료로 합칠 수 있다. |
| 19 | GoodLIB -Zlib & Anna's Archive Extension | 탈락 | 도서 페이지를 비공식 아카이브·다운로드 경로에 연결해 저작권과 외부 사이트 정책에 가치가 종속된다. |
| 20 | Jira Assistant: Worklog, Sprint report, etc | 조건부 보류 | Jira 작업기록·스프린트 보고서는 명확하지만 Jira 권한과 팀별 워크플로 지식·고객 채널이 있을 때만 유효하다. |
| 21 | Work Mode - Block ALL Social Media URL Block | 탈락 | 사이트 차단과 집중 모드는 브라우저·OS 기본 기능과 다수 무료 확장이 더 직접적이다. |
| 22 | Screen Recorder | 탈락 | 화면·창·카메라 녹화 전체는 이미 기본 녹화와 대형 도구가 담당하며 더 좁은 고유 결과가 없다. |
| 23 | Buyhatke: Price History & Tracker, Spend Lens | 탈락 | 가격 이력은 사용자가 필요한 순간 설치하기 전부터 상품별 데이터가 쌓여 있어야 한다. |
| 24 | Always Show Slack Workspace Switcher Sidebar | 탈락 | Slack 브라우저 표시를 사용자 에이전트 위장으로 바꾸는 방식은 플랫폼 UI 변경에 전적으로 종속된다. |
| 25 | Crypto Tracker | 탈락 | 가상자산 시세 표시만으로는 검색·거래소·기본 위젯보다 고유한 문제 해결 결과가 없다. |
| 26 | IBM Equal Access Accessibility Checker | 정밀검사 후보 | 현재 공개 URL→접근성 오류 위치·기준·수정 문장은 문제 뒤 바로 시작하고 axe 계열 검사로 작은 MVP가 가능하다. |
| 27 | Email Extractor | 탈락 | 웹페이지를 자동 순회해 이메일을 대량 수집하는 핵심이 개인정보·스팸과 사이트 정책 위험에 걸린다. |
| 28 | Collie Chrome Extension | 탈락 | 웹페이지를 자동 지식 허브로 바꾼다는 표현만 있고 결과물의 범위·근거·사용 순간이 구체적이지 않다. |
| 29 | Export Twitter Followers | 탈락 | X 팔로워 대량 추출·내보내기는 플랫폼 API·정책·계정 제한에 핵심 가치가 종속된다. |
| 30 | MicroGPT | 탈락 | 코드 제안·디버깅·문서화 전체를 묶은 범용 AI 코딩 도구로 한 입력·한 결과의 고유 작업이 아니다. |

### D_pass_near_fail_far — 현재 좋은 원본과 가깝고 Fail과 멀기

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | Fitness Coach - Workout Plan | 탈락 | 개인 목표별 운동 프로그램·수백 개 운동 콘텐츠·장기 추적 전체가 필요하다. |
| 2 | AI Video - AI Video Generator | Merge 재료 | 텍스트·사진→숏폼 영상은 기존 story-short-video의 입력·장면·결과 카드 재료다. |
| 3 | Jolt Education | 조건부 보류 | 교사용 짧은 영상 큐레이션은 좋지만 검수된 영상 재고와 Google Slides 연동 채널이 필요하다. |
| 4 | Schema Markup Validator & Generator | 정밀검사 후보 | 현재 URL→Schema.org 구조화 데이터 오류·미리보기·수정 JSON-LD는 즉시 결과가 생기는 좁은 작업이다. |
| 5 | Calendar Widget & Planner | 탈락 | 달력·일정·위젯·공유 전체는 OS 달력과 위젯이 더 직접적이다. |
| 6 | Data Scraper - AI Data Miner | 정밀검사 후보 | 현재 웹페이지→사용자가 고른 필드→구조화 CSV는 단일 페이지 권한과 즉시 내보내기로 줄일 수 있다. |
| 7 | IntelliCallAI | 조건부 보류 | AI 전화 캠페인은 통신·예약·결제 연동, 정확도 운영, 통화 상대의 반응이 필요해 관련 고객 채널이 있을 때만 검토한다. |
| 8 | Ask Steve: Time-Saving AI Agents For Your Browser | 탈락 | 브라우저용 AI 에이전트 100개와 제작 기능은 범위가 넓고 범용 AI보다 고유한 한 결과가 없다. |
| 9 | Jira Assistant: Worklog, Sprint report, etc | 조건부 보류 | Jira 작업기록·스프린트 보고서는 명확하지만 Jira 권한과 팀별 워크플로 지식·고객 채널이 있을 때만 유효하다. |
| 10 | Productivity Page | 탈락 | 텍스트 편집·플래너·템플릿·AI 비서를 합친 범용 생산성 앱으로 기본 메모보다 좁은 결과가 없다. |
| 11 | Teachers Aid - Skool Chrome Extension | 조건부 보류 | Skool 메시지 CRM은 리드 후속관리 통증이 분명하지만 해당 커뮤니티 플랫폼 고객 채널과 권한이 있을 때만 작동한다. |
| 12 | Transcript Assistant – Meeting Transcripts for Google Meet, Zoom & Teams | 탈락 | Meet·Zoom·Teams 실시간 전사는 플랫폼 자막과 범용 전사 도구가 이미 같은 결과를 제공한다. |
| 13 | Brisk Teaching - AI that Works Where Teachers Work | 조건부 보류 | 교사 계획·피드백·자료 생성을 모두 다루므로 교육 현장 지식과 Google 도구 채널이 있을 때 한 작업으로 좁혀야 한다. |
| 14 | OKEGAS | 탈락 | 다중 모델·템플릿·미리보기·배포를 묶은 앱 빌더 전체라 반나절~2일 세로 조각이 아니다. |
| 15 | App for Google Calendar | 탈락 | Google Calendar 빠른 접근만 제공해 원 서비스와 OS 캘린더보다 고유한 결과가 없다. |
| 16 | Alibaba Search by Image & Image Downloader | 조건부 보류 | 사진→공급 상품 찾기는 셀러 통증이 분명하지만 쇼핑 재고 검색과 소싱 도메인·고객 채널이 있어야 차별화할 수 있다. |
| 17 | Calendars: 스케줄 리마인더 & 타임플래너 | 탈락 | 여러 달력·할 일·루틴을 합친 일정 앱 전체로 OS 캘린더와 미리 알림보다 좁은 고유 결과가 없다. |
| 18 | Structured - 데일리 플래너 | 탈락 | 캘린더·할 일·루틴·습관·AI 계획을 합친 범용 플래너로 기본 앱보다 작은 고유 결과가 없다. |
| 19 | Tactiq: AI note taker for Google Meet, Zoom and MS Teams | 탈락 | 회의 전사·요약은 Meet·Zoom·Teams와 범용 AI가 이미 제공하는 일반 기능이다. |
| 20 | SEO Analyzer: One-Click Website Audit | 정밀검사 후보 | 현재 공개 URL→제목·태그·링크·헤딩 누락표는 즉시 작동하고 1~2일 세로 조각으로 줄일 수 있다. |
| 21 | QuickPOV AI | Merge 재료 | 텍스트→POV 숏폼 영상의 시점·장면 구성은 기존 story-short-video 한 끗 카드 재료로 검토한다. |
| 22 | The Grid - Calendar | 탈락 | 달력 필터·템플릿·드래그 일정 변경은 기존 캘린더가 제공하는 범용 일정 관리다. |
| 23 | Loadium Recorder | 조건부 보류 | 사용 흐름 기록→부하테스트 스크립트는 좁지만 Loadium·JMeter 도메인과 테스트 고객 채널이 있어야 품질을 보장한다. |
| 24 | Homey: Productivity New Tab | 탈락 | 새 탭 북마크·배경·격언은 브라우저 기본 새 탭보다 반복 통증과 결제 이유가 약하다. |
| 25 | KEYSET For Education | 탈락 | 교사 피드백을 쉽게 한다는 문장만 있어 어떤 입력을 받아 어떤 결과를 주는지 판단할 수 없다. |
| 26 | VideoToText | 탈락 | 영상·음성→텍스트 전사만으로는 OS·플랫폼 자막과 범용 AI보다 고유한 결과가 없다. |
| 27 | FastCut | Merge 재료 | 영상→자동 컷·자막·보정 흐름은 기존 story-short-video의 편집 결과와 한 끗 카드 재료로 합칠 수 있다. |
| 28 | NaturalReader - AI Text to Speech | 탈락 | 웹·문서·전자책 읽어주기는 브라우저와 OS의 기본 읽어주기보다 고유한 결과가 없다. |
| 29 | Aprofy | 탈락 | 타이머·과목·시험·계획·진도·성적을 묶은 학습 관리 전체라 한 입력·한 결과로 좁혀지지 않았다. |
| 30 | GPTZero: AI Detection & Writing Replay | 조건부 보류 | AI 탐지·인용 검사·작성 재생은 교육 고객 채널과 판정 정확도 운영이 있을 때 작성 재생 한 작업으로만 검토한다. |

## 최종 운영 규칙

1. `A_immediate_result`를 1차 정렬로 쓴다: 현재 페이지·URL·파일로 곧바로 결과가 나오는 원본을 먼저 본다.
2. `D_pass_near_fail_far`를 2차 정렬로 쓴다: 기존 Pass에 가깝고 기존 Fail에서 먼 후보를 보조로 올린다. 로컬 fastembed 점수는 순서에만 쓴다.
3. 점수가 높아도 자동 승격하지 않는다. 기본 기능, 범용 AI, 사전 재고, 플랫폼 종속, 상대방 필수 행동, 큰 범위는 사람이 탈락시킨다.
4. Merge는 새 원본 수로 세지 않고 기존 시나리오 카드 재료로 보낸다.
5. Custom Reserve는 관련 도메인 지식이나 기존 고객 채널이 있을 때만 다시 연다.
6. 필터 실험은 여기서 끝낸다. 다음 작업은 남은 5개와 다음 순위 후보를 27조합 기준으로 정밀감사하는 일이다.
