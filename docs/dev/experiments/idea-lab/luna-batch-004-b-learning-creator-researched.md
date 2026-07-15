# Luna B 재검증 — 학습·창작·생산성 20개

검사일: 2026-07-12 (Asia/Seoul)

## 범위와 수집 결과

기존 보고서의 LB04-01~20을 그대로 재검증했다. 후보를 추가하거나 삭제하지 않았다. Firecrawl은 사용하지 않았다. 원본·수집 로그는 [.research/luna-batch-004-refresh/b/](../../../../.research/luna-batch-004-refresh/b/)에 저장했다.

- TrustMRR 원본: `trustmrr-ideas.jsonl`에서 Studix, Practiceme, Replay It, SnapLearn, VideoToText, CueCam, Sufler, Documind, Show Notes Generator, SceneRoll, CalBudget, Risenote, AI Renamer의 매출 신호를 재확인했다.
- 한국 앱 원본: `app-store-expanded-unique-apps.jsonl`에서 한국 App Store URL과 기능 설명·한국 스토어 노출을 확인했다.
- 공식 웹페이지: 지정한 28개 URL을 Jina Reader로 요청했으나 실행 환경 DNS가 `r.jina.ai`를 해석하지 못해 수집 실패했다. 로그는 `collection-status.txt`에 남겼다.
- VOC: `rdt --json` 프리플라이트는 실행했으나 Reddit 요청도 같은 DNS 오류로 실패했다. 따라서 VOC를 국내 통과 근거로 사용하지 않았다.

중요한 구분: 한국 App Store 등록·랭킹은 “한국에서 대체 앱이 실제 유통되고 있다”는 근거로는 썼지만, 각 후보의 정확한 행동(예: 자기 PDF의 복습일을 직접 기록, 댓글 약속을 완료까지 추적)을 한국 사용자가 반복한다는 증명으로 과장하지 않았다. 그 정확한 행동을 직접 확인하지 못한 칸은 `N` 또는 `미확인`으로 두었다.

## 판정 규칙

P1/P2/P3은 기존 배치와 같은 세 페르소나다. 각 셀의 `Y/Y/N`은 `10초 이해 / 한국 실제 사용 / 결제 이유` 순서다. `UX 합의`는 세 항목을 모두 Yes로 받은 인원 수다. 국내 URL이 있어도 후보의 핵심 행동을 직접 입증하지 못하면 한국 하드게이트는 실패다.

즉시 실패 규칙을 적용했다. 세 Yes를 동시에 받은 인원이 2명 미만인 후보는 실패다. 또한 한국 상위 앱·OS·기본 문서/캘린더/클라우드 기능이 핵심 결과를 해결하면 실패다. 단순 요약·생성·챗봇형 결과는 소유 결과가 없으면 실패다.

## 20개 재검증 표

| ID | 제목 / UVP | 직접 확인한 한국 URL 또는 미확인 | P1 | P2 | P3 | UX 합의 | 한국 하드게이트 | 새 판정 |
|---|---|---|---|---|---|---:|---|---|
| LB04-01 | **회독시계 — 내 PDF에서 오늘 다시 볼 페이지만 자동으로 남긴다** | [Goodnotes 한국](https://apps.apple.com/kr/app/goodnotes-ai-%EB%85%B8%ED%8A%B8-%EB%AC%B8%EC%84%9C-pdf/id1444383602?uo=4), [플렉슬 한국](https://apps.apple.com/kr/app/%ED%94%8C%EB%A0%89%EC%8A%AC-%EB%85%B8%ED%8A%B8-pdf-%EB%B7%B0%EC%96%B4-%EA%B7%B8%EB%A6%AC%EA%B3%A0-%EB%A9%94%EB%AA%A8%EC%9E%A5/id1531466462?uo=4); 복습일 행동은 미확인 | Y/Y/Y | Y/Y/N | Y/N/N | 1/3 | PDF 주석·노트 대체재는 확인되나 반복 복습·결제 국내 근거 미확인 | **Fail** |
| LB04-02 | **듣기구간복습 — 영어 듣기에서 막힌 20초만 다음 복습일에 다시 튼다** | [AVPlayer 한국](https://apps.apple.com/kr/app/avplayer-%EB%AC%B4%EC%9D%B8%EC%BD%94%EB%94%A9-%EC%86%8D%EB%8F%84%EC%A1%B0%EC%A0%88-%EC%9E%90%EB%A7%89%EC%A7%80%EC%9B%90/id395680819), [말해보카 한국](https://apps.apple.com/kr/app/%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4-%EB%8B%A8%EC%96%B4-%EB%AC%B8%EB%B2%95-%EC%8A%A4%ED%94%BC%ED%82%B9-%EC%98%81%EC%96%B4-%ED%9A%8C%ED%99%94/id1460766549); 20초 구간 복습은 미확인 | Y/Y/Y | Y/Y/Y | Y/Y/N | 2/3 | 통과 기준에 도달하지 못함: 한국에서 정확한 구간 복습을 반복·결제한다는 직접 근거 부족 | **Fail** |
| LB04-03 | **실기루틴판 — 자격증 실기 동작을 전후 영상과 체크표로 합격일까지 쌓는다** | [Replay It 원본 앵커](https://trustmrr.com/startup/replay-it); 한국 국가자격 실기 반복 촬영 URL은 미확인 | Y/Y/Y | Y/N/N | Y/N/N | 0/3 | 국내 실제 사용과 결제 이유 미확인 | **Fail** |
| LB04-04 | **단어회독표 — 내가 틀린 단어만 다음 망각일에 다시 확인한다** | [말해보카 한국](https://apps.apple.com/kr/app/%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4-%EB%8B%A8%EC%96%B4-%EB%AC%B8%EB%B2%95-%EC%8A%A4%ED%94%BC%ED%82%B9-%EC%98%81%EC%96%B4-%ED%9A%8C%ED%99%94/id1460766549), [오르조 한국](https://apps.apple.com/kr/app/%EC%98%A4%EB%A5%B4%EC%A1%B0-%EA%B8%B0%EC%B6%9C%EB%AC%B8%EC%A0%9C-%EC%88%98%EB%8A%A5-%EB%82%B4%EC%8B%A0-%EA%B3%B5%EB%AC%B4%EC%9B%90-%EC%9E%90%EA%B2%A9%EC%A6%9DCBT-%ED%86%A0%EC%9D%B5/id1529046013); 후보의 차별 행동 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 한국 학습 앱이 핵심 복습을 이미 제공 | **Fail** |
| LB04-05 | **강의진도복구 — 여러 강의의 마지막 시청 위치와 다음 한 편을 한 줄로 복구한다** | 한국 강의 플랫폼의 정확한 URL은 미확인 | Y/Y/N | Y/N/N | Y/N/N | 0/3 | 플랫폼별 진도 기능이 핵심 결과를 소유할 가능성이 높고 직접 결제 근거 없음 | **Fail** |
| LB04-06 | **모의고사기록 — 회차별 점수보다 과목별 하락 구간을 다음 시험 전까지 추적한다** | [오르조 한국](https://apps.apple.com/kr/app/%EC%98%A4%EB%A5%B4%EC%A1%B0-%EA%B8%B0%EC%B6%9C%EB%AC%B8%EC%A0%9C-%EC%88%98%EB%8A%A5-%EB%82%B4%EC%8B%A0-%EA%B3%B5%EB%AC%B4%EC%9B%90-%EC%9E%90%EA%B2%A9%EC%A6%9DCBT-%ED%86%A0%EC%9D%B5/id1529046013); 개인 하락 구간 추적은 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 한국 문제·시험 앱과 성적 기록 대체재 확인 | **Fail** |
| LB04-07 | **자막용어검수 — 영상 여러 편의 같은 용어·숫자·고유명을 SRT로 맞춰 내보낸다** | [CapCut 한국](https://apps.apple.com/kr/app/%EC%BA%A1%EC%BB%B7-%EC%82%AC%EC%A7%84-%EB%B0%8F-%EB%8F%99%EC%98%81%EC%83%81-%EC%97%90%EB%94%94%ED%84%B0/id1500855883); 회차 간 용어 검수는 미확인 | Y/Y/Y | Y/Y/N | Y/N/N | 1/3 | 한국 영상 편집 앱은 확인했으나 용어집 기반 검수·결제 행동 미확인 | **Fail** |
| LB04-08 | **강의자료변경표 — 지난 PDF와 이번 PDF의 바뀐 장표만 발표 전 확인한다** | [Goodnotes 한국](https://apps.apple.com/kr/app/goodnotes-ai-%EB%85%B8%ED%8A%B8-%EB%AC%B8%EC%84%9C-pdf/id1444383602?uo=4), [폴라리스 오피스 한국](https://apps.apple.com/kr/app/%ED%8F%B4%EB%9D%BC%EB%A6%AC%EC%8A%A4-%EC%98%A4%ED%94%BC%EC%8A%A4-%EB%AA%A8%EB%B0%94%EC%9D%BC-hwp-pdf-ms%EB%AC%B8%EC%84%9C/id513188658); 강의자료 변경 검수는 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 문서 열람·편집 대체재는 있으나 국내 반복 결제 근거 없음 | **Fail** |
| LB04-09 | **테이크비교 — 같은 대본 두 촬영에서 끊김과 누락만 나란히 확인한다** | [CapCut 한국](https://apps.apple.com/kr/app/%EC%BA%A1%EC%BB%B7-%EC%82%AC%EC%A7%84-%EB%B0%8F-%EB%8F%99%EC%98%81%EC%83%81-%EC%97%90%EB%94%94%ED%84%B0/id1500855883), 기존 중복 [말버릇컷](../../../../docs/dev/experiments/idea-lab/batch-003-ascii-cards.md) | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 기존 `내말속도`·`말버릇컷`과 결과가 인접 중복 | **Fail** |
| LB04-10 | **강의인쇄검수 — PDF를 인쇄했을 때 잘리는 표·빈 페이지를 제출 전에 표시한다** | [Adobe Scan 한국](https://apps.apple.com/kr/app/adobe-scan-ocr-pdf-%EC%8A%A4%EC%BA%90%EB%84%88/id1199564834?uo=4); 인쇄 검수 행동은 미확인 | Y/Y/N | Y/N/N | Y/N/N | 0/3 | PDF·프린터 미리보기로 핵심 결과 대체 가능 | **Fail** |
| LB04-11 | **댓글약속장부 — 댓글에서 약속한 다음 콘텐츠를 상태표로 끝까지 닫는다** | [Notion 한국](https://apps.apple.com/kr/app/notion-%EB%A9%94%EB%AA%A8-%EC%9E%91%EC%97%85-ai/id1232780281?uo=4); 댓글 약속의 한국 반복 사용은 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 범용 작업 관리 앱이 상태표를 대체하고 정확한 결제 행동 미확인 | **Fail** |
| LB04-12 | **콘텐츠재활용표 — 한 원본에서 만든 클립·뉴스레터·게시물의 공개 여부를 한 번에 확인한다** | [CapCut 한국](https://apps.apple.com/kr/app/%EC%BA%A1%EC%BB%B7-%EC%82%AC%EC%A7%84-%EB%B0%8F-%EB%8F%99%EC%98%81%EC%83%81-%EC%97%90%EB%94%94%ED%84%B0/id1500855883), [Notion 한국](https://apps.apple.com/kr/app/notion-%EB%A9%94%EB%AA%A8-%EC%9E%91%EC%97%85-ai/id1232780281?uo=4); 통합 게시 추적은 미확인 | Y/Y/N | Y/Y/N | Y/Y/N | 0/3 | 해외 SceneRoll 매출은 $0/30d이고 국내 결제 결과도 미확인 | **Fail** |
| LB04-13 | **파일버전찾기 — 두 계약·기획서 파일의 달라진 문장만 비교해 최종본을 고른다** | [폴라리스 오피스 한국](https://apps.apple.com/kr/app/%ED%8F%B4%EB%9D%BC%EB%A6%AC%EC%8A%A4-%EC%98%A4%ED%94%BC%EC%8A%A4-%EB%AA%A8%EB%B0%94%EC%9D%BC-hwp-pdf-ms%EB%AC%B8%EC%84%9C/id513188658); 국내 파일 버전 혼선·결제는 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 문서 앱은 확인했지만 후보의 최종본 선택·비교 리포트 수요 미확인 | **Fail** |
| LB04-14 | **사진전후대조 — 수리 전후 사진을 같은 구도로 맞춰 고객에게 변화 한 장으로 보낸다** | [EPIK 한국](https://apps.apple.com/kr/app/epik-%EC%97%90%ED%94%BD-ai-%EC%82%AC%EC%A7%84-%EC%98%81%EC%83%81-%ED%8E%B8%EC%A7%91/id1577705074); 수리·청소·시공 납품 행동은 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 사진 편집 대체재는 확인했으나 작업 증거 납품의 국내 반복·결제 미확인 | **Fail** |
| LB04-15 | **영수증보증표 — 영수증 사진에서 보증 만료일과 수리 접수 파일을 함께 남긴다** | [Google Drive 한국](https://apps.apple.com/kr/app/google-%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B8%8C-%EC%95%88%EC%A0%84%ED%95%9C-%EC%98%A8%EB%9D%BC%EC%9D%B8-%ED%8C%8C%EC%9D%BC-%EC%A0%80%EC%9E%A5%EA%B3%B5%EA%B0%84/id507874739); 보증·수리 통합 행동은 미확인 | Y/Y/Y | Y/N/N | Y/N/N | 0/3 | 구매·수리 빈도와 별도 결제 이유 미확인 | **Fail** |
| LB04-16 | **캘린더변경로그 — 취소·연기된 약속만 모아 다시 잡을 때까지 남긴다** | [네이버 캘린더 한국](https://apps.apple.com/kr/app/%EB%84%A4%EC%9D%B4%EB%B2%84-%EC%BA%98%EB%A6%B0%EB%8D%94-naver-calendar/id592346243?uo=4), [TimeTree 한국](https://apps.apple.com/kr/app/timetree-%EC%BA%98%EB%A6%B0%EB%8D%94-%EA%B3%B5%EC%9C%A0-%EC%95%B1/id952578473?uo=4) | Y/Y/N | Y/Y/N | Y/Y/N | 0/3 | 한국 캘린더·OS 기능이 일정 등록·변경·알림을 해결 | **Fail** |
| LB04-17 | **스크린샷약속 — 카톡 캡처 속 내 할 일을 마감·진행·완료로 끝까지 추적한다** | [Todoist 한국](https://apps.apple.com/kr/app/todoist-to-do-%EB%A6%AC%EC%8A%A4%ED%8A%B8-%ED%94%8C%EB%9E%98%EB%84%88/id572688855?uo=4), [Notion 한국](https://apps.apple.com/kr/app/notion-%EB%A9%94%EB%AA%A8-%EC%9E%91%EC%97%85-ai/id1232780281?uo=4); 카톡 캡처→완료 증거 행동은 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 범용 할 일 앱 대체재는 확인했으나 캡처 추출·완료 증거 결제는 미확인 | **Fail** |
| LB04-18 | **사진백업대조 — 휴대폰 사진과 클라우드의 빠진 날짜만 찾아 백업 완료를 확인한다** | [Google Drive 한국](https://apps.apple.com/kr/app/google-%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B8%8C-%EC%95%88%EC%A0%84%ED%95%9C-%EC%98%A8%EB%9D%BC%EC%9D%B8-%ED%8C%8C%EC%9D%BC-%EC%A0%80%EC%9E%A5%EA%B3%B5%EA%B0%84/id507874739); 사진 날짜 대조는 미확인 | Y/Y/N | Y/Y/N | Y/Y/N | 0/3 | 클라우드·OS 사진 백업이 핵심 결과를 해결 | **Fail** |
| LB04-19 | **다운로드검수 — 제출 폴더에서 잘못된 파일명·낡은 버전·누락 첨부만 표시한다** | [폴라리스 오피스 한국](https://apps.apple.com/kr/app/%ED%8F%B4%EB%9D%BC%EB%A6%AC%EC%8A%A4-%EC%98%A4%ED%94%BC%EC%8A%A4-%EB%AA%A8%EB%B0%94%EC%9D%BC-hwp-pdf-ms%EB%AC%B8%EC%84%9C/id513188658); 제출 직전 반복 검수는 미확인 | Y/Y/Y | Y/N/N | Y/N/N | 0/3 | 파일 탐색기·제출 사이트 확인으로 대체 가능하고 국내 반복 결제 미확인 | **Fail** |
| LB04-20 | **발표질문로그 — 발표 뒤 받은 질문을 답변 상태와 다음 장표 수정으로 연결한다** | [클로바노트 한국](https://apps.apple.com/kr/app/%ED%81%B4%EB%A1%9C%EB%B0%94%EB%85%B8%ED%8A%B8-%EC%9D%8C%EC%84%B1-%EA%B7%B8-%EC%9D%B4%EC%83%81%EC%9D%98-%EA%B8%B0%EB%A1%9D/id1530010245); 발표 후 질문→장표 수정은 미확인 | Y/Y/Y | Y/Y/N | Y/Y/N | 1/3 | 기록 앱은 확인했지만 질문 상태·다음 장표까지의 별도 결제 이득 미확인 | **Fail** |

## 원래 판정 → 새 판정 변경표

| ID | 원래 | 새 판정 | 변경 이유 |
|---|---|---|---|
| LB04-01 | Pass | Fail | 한국 복습 행동·결제 근거를 직접 확인하지 못함; Goodnotes·플렉슬은 PDF 대체재임 |
| LB04-02 | Pass | Fail | 한국 구간 복습 반복 사용을 직접 확인하지 못함 |
| LB04-03 | Pass | Fail | Replay It은 해외 앵커이고 국내 실기 수험 행동은 미확인 |
| LB04-04 | Fail | Fail | 유지; 한국 학습 앱 대체재가 확인됨 |
| LB04-05 | Fail | Fail | 유지; 진도는 플랫폼 소유 |
| LB04-06 | Fail | Fail | 유지; 시험 앱·성적표 대체재가 확인됨 |
| LB04-07 | Pass | Fail | 한국 편집 앱은 확인했지만 용어집 기반 회차 검수는 미확인 |
| LB04-08 | Pass | Fail | PDF 앱 존재만으로 강사 자료 변경 검수 수요를 증명할 수 없음 |
| LB04-09 | Fail | Fail | 유지; `내말속도`·`말버릇컷`과 인접 중복 |
| LB04-10 | Fail | Fail | 유지; PDF·인쇄 미리보기 대체 |
| LB04-11 | Pass | Fail | 댓글 약속의 한국 반복 행동과 결제 미확인 |
| LB04-12 | Fail | Fail | 유지; SceneRoll $0/30d, 통합 게시 추적 미확인 |
| LB04-13 | Pass | Fail | 한국 문서 앱은 확인했지만 버전 비교·최종본 선택 행동 미확인 |
| LB04-14 | Pass | Fail | 사진 편집 앱은 확인했지만 작업 증거 납품 행동 미확인 |
| LB04-15 | Fail | Fail | 유지; 빈도·결제 이유 약함 |
| LB04-16 | Fail | Fail | 유지; 캘린더 기본 기능이 해결 |
| LB04-17 | Pass | Fail | 한국 할 일 앱은 확인했지만 카톡 캡처 업무 추적은 미확인 |
| LB04-18 | Fail | Fail | 유지; 클라우드·OS 백업이 해결 |
| LB04-19 | Fail | Fail | 유지; 탐색기·제출 사이트로 대체 |
| LB04-20 | Fail | Fail | 유지; 기록 앱 대비 별도 결제 이득 미확인 |

## 중복 검사

기존 배치 자료에서 `오답리턴`, `내말속도`, `말버릇컷`, `자막핏`, `발표배분`, `근무표찍기`, `숨은구독`, `하자증거`, `이사반납`, `통신비구멍`, `계약날짜`, `부모님공문`, `진료메모`, `영상한컷`, `박스어디`, `회비대조`, `공구입금`을 재검색했다. 동일 제목은 없지만 LB04-09는 촬영 전후 검수 메커니즘이 `내말속도`·`말버릇컷`과 실질적으로 인접해 계속 실패 처리했다. 나머지는 제목 중복은 없으나, 제목이 다르다는 이유만으로 국내 차별성을 인정하지 않았다.

## 최종 결과

- UX 합의 2/3 이상: **2개** — LB04-02, LB04-03.
- P1/P2/P3의 세 Yes를 동시에 받은 인원이 2명 이상인 후보: **0개**. 따라서 즉시 실패 규칙에 따라 전체 후보를 통과시키지 않는다.
- 한국 하드게이트 통과: **0개**.
- 최종 통과: **0개**.
- 최종 실패: **20개**.

이번 재검증에서 “통과 후보 상세”는 없다. 해외 매출 신호는 지불 가능성의 방향만 보여주며, 한국 실제 사용·국내 결제 이유의 증명이 아니다. Jina/Reddit 수집이 DNS에서 막힌 상태에서 이를 추정으로 채우면 판정 규칙을 위반하므로, 국내 직접 근거가 확보될 때까지 20개 모두 보류가 아닌 **실패**로 확정했다.
