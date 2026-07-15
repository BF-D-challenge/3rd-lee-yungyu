# TASK 2 필터 실험 — 상위 6개 직접 감사

작성일: 2026-07-13

## 결과

| 필터 | 정밀검사 후보 | Merge | Reserve | 탈락 | 무작위 대비 |
|---|---:|---:|---:|---:|---:|
| A_immediate_result — 현재 페이지·설치 직후 결과 | 2/6 | 0/6 | 0/6 | 4/6 | 33.3%p |
| B_pain_and_result — 손실·누락·마감 + 측정 결과 | 0/6 | 0/6 | 0/6 | 6/6 | 0.0%p |
| C_one_in_one_out — 입력 1개 → 처리 1회 → 결과 1개 | 0/6 | 1/6 | 0/6 | 5/6 | 0.0%p |
| D_pass_near_fail_far — 현재 좋은 원본과 가깝고 Fail과 멀기 | 2/6 | 1/6 | 1/6 | 2/6 | 33.3%p |
| E_diverse_outlier — 기존 후보와 다른 종류 | 1/6 | 0/6 | 0/6 | 5/6 | 16.7%p |
| F_post_problem_start — 문제가 생긴 뒤 시작 가능 | 0/6 | 1/6 | 0/6 | 5/6 | 0.0%p |
| G_random_control — 무작위 대조군 | 0/6 | 0/6 | 1/6 | 5/6 | 0.0%p |

무작위는 0/6이었다. 1차 승자는 2/6을 찾은 `A_immediate_result`, `D_pass_near_fail_far`다. 두 방법만 30개 규모로 확장한다.

## A_immediate_result — 현재 페이지·설치 직후 결과

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | PerfectPost: makes Linkedin 10x better | 탈락 | LinkedIn 글쓰기 개선이라는 설명만 있고 고유 입력·검사 기준·소유 결과가 없다. |
| 2 | VlogMap – Extract and map locations from videos & reels | 정밀검사 후보 | 공개 여행 영상 URL→장소·시점 추출→지도·경로는 문제 뒤 바로 시작하고 결과가 선명하다. |
| 3 | Loom – Screen Recorder & Screen Capture | 탈락 | 화면·카메라 녹화와 공유 전체 제품이며 한 작업으로 좁힌 새 원본이 아니다. |
| 4 | Profile Scraper for LinkedIn™ | 탈락 | LinkedIn 검색 결과 대량 수집은 플랫폼 정책과 DOM 변화에 핵심 가치가 종속된다. |
| 5 | Extract WA Group & Contact Links - WhatsApp Link Scraper | 탈락 | WhatsApp 초대·연락처 링크 대량 수집은 플랫폼 정책과 스팸성 리드 수집 위험이 크다. |
| 6 | SEO Analyzer: One-Click Website Audit | 정밀검사 후보 | 현재 공개 URL→제목·태그·링크·헤딩 누락표는 즉시 작동하고 1~2일 세로 조각으로 줄일 수 있다. |

## B_pain_and_result — 손실·누락·마감 + 측정 결과

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | QR Reader for iPhone | 탈락 | QR·바코드·문서 스캔은 휴대폰 기본 카메라와 기본 스캔이 더 직접적이다. |
| 2 | Discover Mobile | 탈락 | 은행·카드 계좌 운영 전체이며 결과와 권한을 금융기관이 소유한다. |
| 3 | Todo - Task List Organizer | 탈락 | 할 일·프로젝트·동기화 전체 앱으로 OS 기본 할 일보다 좁은 고유 결과가 없다. |
| 4 | Sweat: Fitness App For Women | 탈락 | 운동 프로그램·커뮤니티·트레이너 콘텐츠 전체가 필요해 1인 1~3화면 MVP가 아니다. |
| 5 | Me+ Lifestyle Routine | 탈락 | 습관·기분·루틴 추적 전체이며 기본 앱과 기존 습관 도구보다 유일한 결과가 없다. |
| 6 | Hevy - Gym Tracker Workout Log | 탈락 | 운동 기록·영상·친구 비교·루틴 전체로 콘텐츠와 네트워크 효과가 필요하다. |

## C_one_in_one_out — 입력 1개 → 처리 1회 → 결과 1개

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | Dave: Credit, Cash & Money App | 탈락 | 현금 선지급·은행계좌·상환 자격 판정은 규제 금융 인프라다. |
| 2 | JustFit: Lazy Workout & Fit | 탈락 | 개인화 운동 과정과 대규모 운동 콘텐츠 전체가 핵심이라 작은 변환 도구로 줄이기 어렵다. |
| 3 | Capital One Mobile | 탈락 | 은행 계정·결제·대출·송금·신용 관리 전체 서비스다. |
| 4 | SoFi: Bank, Invest & Crypto | 탈락 | 은행·투자·가상자산을 묶은 금융 플랫폼 전체다. |
| 5 | CommentHunter.click - Extract Social Media Comments | Merge 재료 | 소셜 URL→댓글 CSV는 기존 social-comment-guard가 받을 입력 파일을 만드는 수집 카드 재료다. |
| 6 | Seven: 7 Minute Workout | 탈락 | 7분 운동 콘텐츠·개인 계획·친구 경쟁을 묶은 운동 서비스로 결과가 콘텐츠에 의존한다. |

## D_pass_near_fail_far — 현재 좋은 원본과 가깝고 Fail과 멀기

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | Fitness Coach - Workout Plan | 탈락 | 개인 목표별 운동 프로그램·수백 개 운동 콘텐츠·장기 추적 전체가 필요하다. |
| 2 | AI Video - AI Video Generator | Merge 재료 | 텍스트·사진→숏폼 영상은 기존 story-short-video의 입력·장면·결과 카드 재료다. |
| 3 | Jolt Education | Custom Reserve | 교사용 짧은 영상 큐레이션은 좋지만 검수된 영상 재고와 Google Slides 연동 채널이 필요하다. |
| 4 | Schema Markup Validator & Generator | 정밀검사 후보 | 현재 URL→Schema.org 구조화 데이터 오류·미리보기·수정 JSON-LD는 즉시 결과가 생기는 좁은 작업이다. |
| 5 | Calendar Widget & Planner | 탈락 | 달력·일정·위젯·공유 전체는 OS 달력과 위젯이 더 직접적이다. |
| 6 | Data Scraper - AI Data Miner | 정밀검사 후보 | 현재 웹페이지→사용자가 고른 필드→구조화 CSV는 단일 페이지 권한과 즉시 내보내기로 줄일 수 있다. |

## E_diverse_outlier — 기존 후보와 다른 종류

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | VlogMap – Extract and map locations from videos & reels | 정밀검사 후보 | 공개 여행 영상 URL→장소·시점 추출→지도·경로는 문제 뒤 바로 시작하고 결과가 선명하다. |
| 2 | Habit Burger Grill | 탈락 | 특정 음식점의 주문·결제·매장 찾기 앱으로 재사용할 독립 소프트웨어 메커니즘이 없다. |
| 3 | Buyhatke: Price History & Tracker, Spend Lens | 탈락 | 가격 이력은 사용자가 필요한 순간 설치하기 전부터 상품별 데이터가 쌓여 있어야 한다. |
| 4 | Podium - Small Business Tools | 탈락 | 전화·문자·리뷰·결제·마케팅 전체를 묶어 여러 채널 연결과 고객 행동이 필수다. |
| 5 | IPTV Player & VPN App Bundle | 탈락 | IPTV 플레이어와 VPN 묶음은 콘텐츠 권리·네트워크·다중 플랫폼 전체 사업이다. |
| 6 | Profile Scraper for LinkedIn™ | 탈락 | LinkedIn 검색 결과 대량 수집은 플랫폼 정책과 DOM 변화에 핵심 가치가 종속된다. |

## F_post_problem_start — 문제가 생긴 뒤 시작 가능

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | AI Video - AI Video Generator | Merge 재료 | 텍스트·사진→숏폼 영상은 기존 story-short-video의 입력·장면·결과 카드 재료다. |
| 2 | Capital One Mobile | 탈락 | 은행 계정·결제·대출·송금·신용 관리 전체 서비스다. |
| 3 | Hevy - Gym Tracker Workout Log | 탈락 | 운동 기록·영상·친구 비교·루틴 전체로 콘텐츠와 네트워크 효과가 필요하다. |
| 4 | SoFi: Bank, Invest & Crypto | 탈락 | 은행·투자·가상자산을 묶은 금융 플랫폼 전체다. |
| 5 | Activity Tracker・FitnessView | 탈락 | Apple Health·Watch 데이터를 다시 보여주는 대시보드로 기본 건강 앱보다 좁은 고유 결과가 없다. |
| 6 | Mail App for Gmail | 탈락 | Gmail 계정을 지속 연동하는 대체 메일 클라이언트이며 Gmail 기본 앱보다 직접적이지 않다. |

## G_random_control — 무작위 대조군

| 순위 | 실제 원본 | 판정 | 이유 |
|---:|---|---|---|
| 1 | Ticketdesk AI | Custom Reserve | 지식베이스 답변 자동화는 고객지원 채널·정확도 운영·고객 응답이 필요한 커스텀 구축이다. |
| 2 | AI Headshot Generator | 탈락 | 기업용 AI 헤드샷 생성은 무료·범용 이미지 AI와 구분할 고유 작업이 없고 매출도 0이다. |
| 3 | Focus - Timer for Productivity | 탈락 | 포모도로 타이머와 할 일은 OS 타이머·수많은 무료 도구가 더 간단하다. |
| 4 | Capital·com: 온라인 거래 플랫폼 | 탈락 | CFD 거래·입출금·리스크 관리 전체는 규제 금융 플랫폼이다. |
| 5 | Smooth Cursorify | 탈락 | 커서 애니메이션은 즉시 작동하지만 반복 통증과 자연스러운 결제자 3개가 없다. |
| 6 | Investor Dashboard | 탈락 | 이름 외에 입력·처리·결과·사용 순간을 판단할 설명이 없다. |

## 판정 원칙

- 경쟁 앱이 있다는 이유만으로 탈락시키지 않았다.
- 이미 받은 URL·파일·내역·단일 권한으로 문제 뒤 시작할 수 있는지 확인했다.
- 제품이 직접 만들 수 있는 결과가 없거나 플랫폼·상대방이 결과를 소유하면 탈락 또는 Reserve로 분리했다.
- 기존 앱과 같은 메커니즘이면 새 원본 수가 아니라 Merge로 기록했다.
