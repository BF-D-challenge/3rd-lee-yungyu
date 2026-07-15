#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const candidates = new Map(
  readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl")
    .map((row) => [row.key, row]),
);
const appKeys = new Set(
  JSON.parse(fs.readFileSync(path.join(root, "docs/research/idea-app-portfolio.json"), "utf8"))
    .map((row) => row.source_key),
);
const auditedKeys = new Set();
for (const file of fs.readdirSync(path.join(root, "docs/research"))) {
  if (!/^idea-strong-mechanism-batch-(00[1-9]|01[0-4]).*(input|card-drafts).*\.jsonl$/.test(file)) continue;
  for (const row of readJsonl(path.join("docs/research", file))) {
    const key = row.source_key ?? row.key ?? row.research?.key;
    if (key) auditedKeys.add(key);
  }
}

const contracts = [
  {
    source_key: "trustmrr:sessionwatcher",
    selection_reason: "Codex·Claude Code 로컬 세션 기록을 읽어 지금 쓴 토큰을 메뉴 막대 한 칸에 보여주는 반복 개발 작업이다.",
    prior_review_feedback: "입력은 Mac의 Codex·Claude Code 세션 로그 폴더를 읽는 단일 기기 권한이다. 외부 계정 데이터나 요금 추정은 쓰지 않고 로컬 로그에 기록된 토큰만 합산한다.",
    card_draft: {
      payers: [
        { value: "AI 코딩 도구 비용을 직접 관리하는 1인 개발자", detail: "Codex와 Claude Code를 번갈아 쓰지만 어느 도구와 프로젝트에서 토큰을 많이 썼는지 로그를 직접 열지 않으면 알기 어렵다." },
        { value: "여러 고객 MVP를 AI로 만드는 개발 대행사 리드", detail: "동시에 진행하는 고객 프로젝트별 사용량을 확인해야 하지만 로컬 세션 기록을 매번 손으로 합산한다." },
        { value: "사용량 제한 안에서 제품을 만드는 인디 창업자", detail: "긴 생성 작업 전에 오늘 사용량을 확인하려고 터미널과 설정 화면을 오가며 현재 상태를 추측한다." },
      ],
      moments: [
        { value: "긴 코드 생성 작업을 시작하기 직전", detail: "작업 중간에 사용량이 부족해지면 흐름이 끊기므로 지금까지 쓴 토큰을 한눈에 확인해야 한다." },
        { value: "평소보다 AI 사용량이 빨리 늘었다고 느낀 직후", detail: "어느 도구·프로젝트·세션이 원인인지 로그 전체를 열지 않고 바로 확인할 근거가 필요하다." },
        { value: "오늘 AI 코딩 작업을 마무리하기 전", detail: "다음 작업 계획과 고객별 시간을 정리하려면 오늘 사용량을 짧은 카드로 남겨야 한다." },
      ],
      twists: [
        { value: "Codex와 Claude Code의 오늘 토큰을 나눠 표시하기", detail: "오늘 로컬 로그에 기록된 토큰을 도구별로 합산한다.", resultTitle: "오늘 Codex Claude Code 토큰 사용량 카드", smallestBuild: "Mac의 Codex·Claude Code 세션 로그 폴더를 읽는 단일 기기 권한을 받아 오늘 토큰을 도구별로 합산하고, 메뉴 막대 사용량 카드 하나를 즉시 표시한다." },
        { value: "프로젝트별 토큰 사용량 상위 세 개 보여주기", detail: "로그의 작업 경로를 기준으로 프로젝트별 토큰 합계를 보여준다.", resultTitle: "AI 코딩 프로젝트별 토큰 상위 사용량 카드", smallestBuild: "Mac의 Codex·Claude Code 세션 로그 폴더를 읽는 단일 기기 권한을 받아 작업 경로별 토큰을 합산하고, 상위 프로젝트 세 개가 적힌 메뉴 막대 카드 하나를 즉시 표시한다." },
        { value: "현재 세션의 입력·출력 토큰 비율 보여주기", detail: "가장 최근 세션에 기록된 입력·출력 토큰 비율만 보여준다.", resultTitle: "현재 AI 코딩 세션 입출력 토큰 카드", smallestBuild: "Mac의 Codex·Claude Code 세션 로그 폴더를 읽는 단일 기기 권한을 받아 최근 세션의 입력·출력 토큰을 합산하고, 비율이 적힌 메뉴 막대 카드 하나를 즉시 표시한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:takeout-tools",
    selection_reason: "Google Takeout 저장 장소 ZIP 하나를 지도·GIS에서 다시 쓸 위치 파일 하나로 바꾸는 결정적 데이터 변환이다.",
    prior_review_feedback: "입력은 Google Takeout 저장 장소 ZIP 하나다. ZIP 안의 이름·주소·좌표만 사용하며 별도 지오코딩은 하지 않는다.",
    card_draft: {
      payers: [
        { value: "구글 지도 저장 장소를 다른 지도 앱으로 옮기는 여행 기록자", detail: "여행지와 맛집을 오래 저장했지만 서비스를 바꿀 때 목록을 하나씩 다시 입력해야 한다." },
        { value: "현장 조사 장소를 지도 파일로 정리하는 지역 연구자", detail: "Takeout의 복잡한 JSON을 직접 열어 좌표를 골라내야 한다." },
        { value: "고객의 저장 장소 데이터를 이전하는 지도 데이터 프리랜서", detail: "고객마다 저장 목록을 CSV·GPX·GeoJSON으로 바꾸느라 파일 구조를 반복 분석한다." },
      ],
      moments: [
        { value: "Google Takeout 저장 장소 ZIP을 받은 직후", detail: "바로 열어볼 위치 목록이 없어 실제 장소 이름과 좌표가 담긴 결과 파일이 필요하다." },
        { value: "저장 장소를 새 지도 앱으로 가져오기 직전", detail: "앱이 받는 형식으로 바꾸지 않으면 수백 개 장소를 다시 입력해야 한다." },
        { value: "위치 목록을 동료나 고객에게 넘기기 전", detail: "원본 Takeout 구조 대신 읽을 수 있는 표나 지도 파일 하나가 필요하다." },
      ],
      twists: [
        { value: "장소명·주소·위도·경도를 CSV로 펼치기", detail: "각 장소를 표의 한 행으로 만든다.", resultTitle: "구글 저장 장소 좌표 CSV 변환 파일", smallestBuild: "Google Takeout 저장 장소 ZIP 파일 하나를 입력받아 내부 이름·주소·위도·경도를 한 번 파싱하고, 장소별 한 행인 CSV 파일 한 개를 즉시 반환한다." },
        { value: "저장 장소를 GPX waypoint로 바꾸기", detail: "기존 좌표를 다른 지도 앱용 GPX waypoint로 변환한다.", resultTitle: "구글 저장 장소 GPX waypoint 변환 파일", smallestBuild: "Google Takeout 저장 장소 ZIP 파일 하나를 입력받아 장소명과 좌표를 한 번 파싱하고, waypoint가 담긴 GPX 파일 한 개를 즉시 반환한다." },
        { value: "저장 목록 폴더를 유지한 GeoJSON 만들기", detail: "목록 이름을 속성으로 붙인 GeoJSON 포인트를 만든다.", resultTitle: "구글 저장 목록별 GeoJSON 위치 파일", smallestBuild: "Google Takeout 저장 장소 ZIP 파일 하나를 입력받아 장소명·좌표·목록 이름을 한 번 파싱하고, 목록 속성이 붙은 GeoJSON 파일 한 개를 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:sitemaptollm",
    selection_reason: "공개 사이트맵 URL 하나를 AI 크롤러용 llms.txt 파일 하나로 변환하는 좁고 결정적인 개발 도구다.",
    prior_review_feedback: "입력은 공개 XML·HTML 사이트맵 URL 하나다. 해당 URL만 읽고 AI 노출·검색 순위는 보장하지 않는다.",
    card_draft: {
      payers: [
        { value: "자사 문서 사이트를 직접 운영하는 1인 SaaS 개발자", detail: "페이지가 늘 때마다 AI 도구가 읽을 경로 목록을 수기로 정리한다." },
        { value: "여러 고객 사이트를 관리하는 콘텐츠 대행 실무자", detail: "사이트맵을 보고 llms.txt 초안을 반복 작성하며 제목과 경로를 복사한다." },
        { value: "개발자 문서 포털을 배포하는 테크니컬 라이터", detail: "문서 구조가 바뀔 때 사이트맵과 AI 크롤러 안내 파일을 따로 맞춘다." },
      ],
      moments: [
        { value: "사이트맵을 새로 공개한 직후", detail: "공개 경로가 준비된 지금 llms.txt를 만들지 않으면 문서 목록을 다시 모아야 한다." },
        { value: "사이트 문서 구조를 크게 바꾼 직후", detail: "오래된 경로를 남기지 않으려면 현재 사이트맵 기준 결과가 필요하다." },
        { value: "AI 크롤러 안내 파일을 배포하기 직전", detail: "잘못된 URL이나 중복 경로를 공개하기 전에 실제 사이트맵 결과를 검수해야 한다." },
      ],
      twists: [
        { value: "페이지 제목과 URL을 한 줄씩 정리하기", detail: "각 페이지를 제목과 URL 한 줄 형식으로 만든다.", resultTitle: "사이트맵 제목 URL llms.txt 변환 파일", smallestBuild: "공개 XML·HTML 사이트맵 URL 하나를 입력받아 페이지 제목과 URL을 한 번 파싱하고, 한 페이지 한 줄인 llms.txt 파일 한 개를 즉시 반환한다." },
        { value: "URL 경로별로 문서 섹션 묶기", detail: "첫 경로 구간이 같은 페이지를 같은 섹션으로 묶는다.", resultTitle: "사이트맵 경로별 섹션 llms.txt 파일", smallestBuild: "공개 XML·HTML 사이트맵 URL 하나를 입력받아 URL 경로를 한 번 파싱하고, 첫 경로 구간별 섹션이 붙은 llms.txt 파일 한 개를 즉시 반환한다." },
        { value: "쿼리·중복 경로를 뺀 목록 만들기", detail: "쿼리를 제거했을 때 같은 URL은 하나만 남긴다.", resultTitle: "중복 경로 제거 llms.txt 변환 파일", smallestBuild: "공개 XML·HTML 사이트맵 URL 하나를 입력받아 경로를 한 번 정규화하고, 쿼리·중복 URL이 제거된 llms.txt 파일 한 개를 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:octree",
    selection_reason: "LaTeX 원고 파일 하나의 반복 컴파일 오류를 고쳐 다시 열 수 있는 tex 파일 하나로 돌려주는 전문 편집 도구다.",
    prior_review_feedback: "입력은 단일 .tex 파일 하나다. 외부 참고문헌 없이 특수문자·중괄호·표 열 개수 문제만 고친다.",
    card_draft: {
      payers: [
        { value: "LaTeX로 논문 초안을 쓰는 대학원생", detail: "작은 문법 오류 때문에 컴파일이 멈추면 긴 파일에서 원인을 직접 찾는다." },
        { value: "기술 문서를 LaTeX로 납품하는 프리랜서 편집자", detail: "특수문자와 표 문법을 다시 고치느라 반복 시간이 든다." },
        { value: "수업 자료를 LaTeX로 만드는 공학 강사", detail: "괄호와 표 열 개수가 어긋나면 배포 직전까지 오류를 추적한다." },
      ],
      moments: [
        { value: "LaTeX 원고가 컴파일 오류로 멈춘 직후", detail: "해당 파일 안에서 고칠 수 있는 문법 오류를 즉시 수정해야 한다." },
        { value: "논문이나 기술 문서를 PDF로 만들기 직전", detail: "내용은 건드리지 않고 컴파일을 막는 오류만 정리해야 한다." },
        { value: "LaTeX 원고를 공동 작업자에게 넘기기 전", detail: "상대가 같은 오류를 다시 찾지 않도록 고친 원고를 보내야 한다." },
      ],
      twists: [
        { value: "일반 문장 속 LaTeX 특수문자만 이스케이프하기", detail: "명령 밖의 %, _, &, # 문자만 이스케이프한다.", resultTitle: "LaTeX 특수문자 컴파일 오류 수정 파일", smallestBuild: "LaTeX .tex 파일 하나를 입력받아 명령 밖의 %, _, &, # 문자를 한 번 정적 검사해 이스케이프하고, 수정된 .tex 파일 한 개를 즉시 반환한다." },
        { value: "짝이 맞지 않는 중괄호 위치만 고치기", detail: "한 줄 안에서 닫히지 않은 단순 중괄호만 보정한다.", resultTitle: "LaTeX 중괄호 문법 오류 수정 파일", smallestBuild: "LaTeX .tex 파일 하나를 입력받아 한 줄 안의 단순 중괄호 짝을 한 번 정적 검사해 보정하고, 수정된 .tex 파일 한 개를 즉시 반환한다." },
        { value: "표 선언과 행의 열 개수 맞추기", detail: "단순 tabular 행에서 부족한 마지막 빈 셀만 보정한다.", resultTitle: "LaTeX 표 열 개수 오류 수정 파일", smallestBuild: "LaTeX .tex 파일 하나를 입력받아 단순 tabular 행의 열 개수를 한 번 검사하고 부족한 마지막 빈 셀을 보정해, 수정된 .tex 파일 한 개를 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:beep-productivity-inc",
    selection_reason: "URL·요소·댓글 한 덩어리로 실제 화면 위치가 보이는 피드백 파일 하나를 만드는 웹 수정 협업 조각이다.",
    prior_review_feedback: "입력은 `공개 URL#CSS selector|댓글` 텍스트 한 덩어리이며 팀원의 추가 행동은 필요 없다.",
    card_draft: {
      payers: [
        { value: "고객 웹사이트 수정 요청을 정리하는 소형 대행사 PM", detail: "스크린샷과 메신저를 오가며 수정 위치를 설명하다 다른 요소를 고치는 일이 반복된다." },
        { value: "개발자에게 화면 수정을 요청하는 1인 브랜드 마케터", detail: "개발 용어를 몰라 버튼과 문구 위치를 길게 설명한다." },
        { value: "프론트엔드 납품 화면을 검수하는 프리랜서 디자이너", detail: "화면 위치·댓글·뷰포트를 한 문서로 다시 정리해야 한다." },
      ],
      moments: [
        { value: "라이브 웹페이지에서 고칠 요소를 발견한 직후", detail: "실제 위치와 요청 문장을 묶은 피드백 파일을 바로 만들어야 한다." },
        { value: "개발자에게 수정 요청을 보내기 직전", detail: "페이지 캡처와 대상 표시가 붙은 근거가 필요하다." },
        { value: "웹페이지 최종 검수 결과를 고객에게 공유하기 전", detail: "한 항목의 위치와 요청을 읽을 수 있는 결과로 남겨야 한다." },
      ],
      twists: [
        { value: "데스크톱 화면에서 대상 요소를 테두리로 표시하기", detail: "1440px 화면 캡처에서 대상 요소를 강조한다.", resultTitle: "웹 수정 위치가 표시된 데스크톱 피드백", smallestBuild: "`공개 URL#CSS selector|댓글` 텍스트 한 덩어리를 입력받아 1440px 화면에서 대상 요소를 한 번 캡처하고, 위치와 댓글이 붙은 HTML 피드백 파일 한 개를 즉시 반환한다." },
        { value: "모바일 화면에서 대상 요소를 테두리로 표시하기", detail: "390px 모바일 화면에서 대상 요소와 댓글을 보여준다.", resultTitle: "웹 수정 위치가 표시된 모바일 피드백", smallestBuild: "`공개 URL#CSS selector|댓글` 텍스트 한 덩어리를 입력받아 390px 화면에서 대상 요소를 한 번 캡처하고, 위치와 댓글이 붙은 HTML 피드백 파일 한 개를 즉시 반환한다." },
        { value: "대상 CSS selector를 개발자용으로 함께 적기", detail: "피드백 아래에 selector를 복사 가능한 코드로 표시한다.", resultTitle: "CSS selector가 붙은 웹 수정 피드백", smallestBuild: "`공개 URL#CSS selector|댓글` 텍스트 한 덩어리를 입력받아 대상 요소를 한 번 캡처하고, 위치·댓글·복사 가능한 selector가 붙은 HTML 피드백 파일 한 개를 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:myterrace-net",
    selection_reason: "경기 정보와 로고를 반복 사용 가능한 매치데이 그래픽 한 장으로 만드는 스포츠 운영 도구다.",
    prior_review_feedback: "입력은 경기 정보와 로고 URL이 줄 단위로 적힌 텍스트 한 덩어리다. 외부 경기 데이터는 찾지 않는다.",
    card_draft: {
      payers: [
        { value: "아마추어 축구팀 SNS를 맡은 선수 겸 운영자", detail: "디자인 담당자가 없어 경기마다 모바일 편집 앱을 반복해서 연다." },
        { value: "유소년 축구클럽 경기를 알리는 코치", detail: "훈련과 이동 중에는 경기 공지 템플릿을 직접 편집할 시간이 부족하다." },
        { value: "지역 풋살리그 여러 경기를 공지하는 운영자", detail: "팀과 시간이 바뀔 때마다 로고 크기와 글자 위치를 수작업으로 맞춘다." },
      ],
      moments: [
        { value: "게시할 경기 정보가 최종 확정된 직후", detail: "입력된 팀명·일시·스코어로 바로 올릴 이미지가 필요하다." },
        { value: "디자인 담당자 없이 경기 공지를 올려야 할 때", detail: "템플릿을 직접 편집하지 않아도 팀 모양을 유지한 그래픽 한 장이 필요하다." },
        { value: "경기 정보를 수정해 다시 공지하기 직전", detail: "현재 정보로 새 이미지를 즉시 만들어야 한다." },
      ],
      twists: [
        { value: "인스타그램 정사각형 매치데이 카드 만들기", detail: "1080×1080 정사각형 템플릿에 경기 정보를 배치한다.", resultTitle: "축구 경기 정보 정사각형 매치데이 카드", smallestBuild: "팀명·경기명·일시·스코어·로고 URL가 줄 단위로 적힌 텍스트 한 덩어리를 입력받아 정보를 한 번 배치하고, 1080×1080 매치데이 PNG 한 장을 즉시 반환한다." },
        { value: "스토리 세로형 매치데이 카드 만들기", detail: "1080×1920 세로 템플릿에 같은 정보를 배치한다.", resultTitle: "축구 경기 정보 세로형 스토리 카드", smallestBuild: "팀명·경기명·일시·스코어·로고 URL가 줄 단위로 적힌 텍스트 한 덩어리를 입력받아 정보를 한 번 배치하고, 1080×1920 매치데이 PNG 한 장을 즉시 반환한다." },
        { value: "하단 스폰서 바가 있는 매치데이 카드 만들기", detail: "입력된 스폰서명·로고 URL를 하단 고정 바에 배치한다.", resultTitle: "스폰서 바가 붙은 축구 매치데이 카드", smallestBuild: "팀명·경기명·일시·스코어·팀과 스폰서 로고 URL가 줄 단위로 적힌 텍스트 한 덩어리를 입력받아 정보를 한 번 배치하고, 하단 스폰서 바가 있는 PNG 한 장을 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:payping-1",
    selection_reason: "청구서 PDF 한 장의 번호·금액·기한을 읽어 바로 보낼 연체 안내문 한 파일로 만드는 현금흐름 작업이다.",
    prior_review_feedback: "입력은 청구 정보가 적힌 PDF 하나다. 자동 발송·회계 연동·회수 예측은 하지 않는다.",
    card_draft: {
      payers: [
        { value: "외주비 청구서를 직접 보내는 프리랜서", detail: "지급기한이 지나면 문구를 다시 쓰며 금액과 청구번호를 복사하다 실수한다." },
        { value: "여러 고객의 월 청구를 관리하는 소형 대행사 대표", detail: "미수 청구서마다 같은 후속 메일을 만들고 실제 금액·기한을 다시 확인한다." },
        { value: "납품 대금을 직접 확인하는 소규모 공급업체 운영자", detail: "거래처에 전화하기 전 정확한 청구 근거가 있는 안내를 직접 작성한다." },
      ],
      moments: [
        { value: "청구서 지급기한이 하루 지난 직후", detail: "청구번호·금액·기한을 정확히 적은 정중한 문장이 필요하다." },
        { value: "주간 미수금 목록에서 연체 청구서를 발견했을 때", detail: "해당 PDF에서 근거를 읽어 후속 연락 한 건을 준비해야 한다." },
        { value: "거래처에 미수금 전화를 걸기 직전", detail: "통화 전에 같은 내용을 글로 보내 기록을 남겨야 한다." },
      ],
      twists: [
        { value: "제목과 본문이 있는 정중한 이메일 만들기", detail: "청구번호·금액·기한을 제목과 본문에 넣는다.", resultTitle: "연체 청구서 금액·기한 확인 이메일", smallestBuild: "거래처명·청구번호·금액·지급기한·입금계좌가 적힌 청구서 PDF 파일 하나를 입력받아 필드를 한 번 추출하고, 제목과 본문이 있는 TXT 안내문 한 파일을 즉시 반환한다." },
        { value: "카카오톡으로 보낼 300자 안내 만들기", detail: "핵심 청구 정보가 빠지지 않는 300자 이하 메시지로 줄인다.", resultTitle: "연체 청구서 300자 카카오톡 안내", smallestBuild: "거래처명·청구번호·금액·지급기한·입금계좌가 적힌 청구서 PDF 파일 하나를 입력받아 필드를 한 번 추출하고, 300자 이하 TXT 안내문 한 파일을 즉시 반환한다." },
        { value: "한국어·영어를 나란히 적은 안내 만들기", detail: "같은 내용을 한국어와 영어로 병기한다.", resultTitle: "연체 청구서 한영 병기 지급 안내", smallestBuild: "거래처명·청구번호·금액·지급기한·입금계좌가 적힌 청구서 PDF 파일 하나를 입력받아 필드를 한 번 추출하고, 한국어·영어가 병기된 TXT 안내문 한 파일을 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:taillens-tool-for-frontend-developers",
    selection_reason: "공개 페이지의 한 요소와 변경값을 받아 Tailwind 클래스의 최소 수정 diff 하나로 돌려주는 전문 도구다.",
    prior_review_feedback: "입력은 `공개 URL#CSS selector|변경 속성=값` 텍스트 한 덩어리다. 전체 복제·자동 배포는 하지 않는다.",
    card_draft: {
      payers: [
        { value: "Tailwind로 고객 사이트를 만드는 프론트엔드 개발자", detail: "브라우저에서 클래스를 바꿔 보고 코드에서 다시 찾아 수정한다." },
        { value: "여러 반응형 페이지를 검수하는 웹 퍼블리셔", detail: "어떤 Tailwind 클래스가 최소 수정인지 다시 계산한다." },
        { value: "디자인 시스템 규칙을 관리하는 UI 엔지니어", detail: "현재 class와 교체 class를 수기로 비교한다." },
      ],
      moments: [
        { value: "브라우저에서 한 요소의 디자인 오류를 발견한 직후", detail: "대상 요소와 원하는 값을 넣어 최소 class 변경을 확인해야 한다." },
        { value: "화면 수정 내용을 코드 리뷰에 올리기 직전", detail: "요청한 시각 속성만 고쳤다는 작은 diff가 필요하다." },
        { value: "같은 요소의 Tailwind class를 다시 조합하기 전", detail: "현재 class에서 교체할 한 줄을 먼저 확인해야 한다." },
      ],
      twists: [
        { value: "간격 값을 Tailwind spacing class로 바꾸기", detail: "요청한 margin·padding 값만 spacing class로 바꾼다.", resultTitle: "Tailwind 간격 class 최소 수정 diff", smallestBuild: "`공개 URL#CSS selector|margin 또는 padding=값` 텍스트 한 덩어리를 입력받아 현재 class를 한 번 읽고, spacing class 한 줄만 바뀐 diff 파일 한 개를 즉시 반환한다." },
        { value: "색상 값을 Tailwind color class로 바꾸기", detail: "요청한 텍스트·배경색만 color class로 바꾼다.", resultTitle: "Tailwind 색상 class 최소 수정 diff", smallestBuild: "`공개 URL#CSS selector|text 또는 background color=값` 텍스트 한 덩어리를 입력받아 현재 class를 한 번 읽고, color class 한 줄만 바뀐 diff 파일 한 개를 즉시 반환한다." },
        { value: "변경값을 한 breakpoint에만 적용하기", detail: "sm·md·lg 중 한 breakpoint에만 요청 class를 붙인다.", resultTitle: "Tailwind 반응형 breakpoint 최소 수정 diff", smallestBuild: "`공개 URL#CSS selector|breakpoint와 class=값` 텍스트 한 덩어리를 입력받아 현재 class를 한 번 읽고, 지정 breakpoint class 한 줄만 추가된 diff 파일 한 개를 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:fonzo-io",
    selection_reason: "SVG 아이콘 ZIP 하나를 웹폰트 패키지 ZIP 하나로 바꾸는 결정적 디자인 개발 변환이다.",
    prior_review_feedback: "입력은 단색 SVG 아이콘이 든 ZIP 하나다. 외부 아이콘이나 브랜드 자산은 추가하지 않는다.",
    card_draft: {
      payers: [
        { value: "고객 사이트에 아이콘 세트를 넣는 프론트엔드 개발자", detail: "SVG 파일명과 codepoint를 정하고 폰트·CSS를 따로 만든다." },
        { value: "디자인 시스템 아이콘을 배포하는 UI 엔지니어", detail: "새 아이콘을 기존 class 규칙에 맞춰 패키지로 다시 만든다." },
        { value: "레거시 웹 프로젝트를 유지보수하는 퍼블리셔", detail: "웹폰트 변환과 매핑표를 손으로 만든다." },
      ],
      moments: [
        { value: "최종 SVG 아이콘 세트를 전달받은 직후", detail: "같은 이름으로 부를 수 있는 웹폰트 패키지가 필요하다." },
        { value: "아이콘을 실제 웹 프로젝트에 넣기 직전", detail: "폰트와 CSS class가 맞는 설치 결과를 확인해야 한다." },
        { value: "아이콘 웹폰트를 다른 개발자에게 넘기기 전", detail: "codepoint와 사용법을 추측하지 않도록 패키지가 필요하다." },
      ],
      twists: [
        { value: "파일명을 CSS class 이름으로 유지하기", detail: "SVG 파일명을 `.icon-이름` class로 만든다.", resultTitle: "SVG 파일명 유지 웹폰트 패키지", smallestBuild: "단색 SVG 아이콘이 든 ZIP 파일 하나를 입력받아 glyph 웹폰트로 한 번 변환하고, 파일명 기반 CSS class가 포함된 웹폰트 패키지 ZIP 한 개를 즉시 반환한다." },
        { value: "모든 SVG의 viewBox를 같은 크기로 맞추기", detail: "viewBox를 같은 em 영역으로 맞춘다.", resultTitle: "SVG 크기 정렬 웹폰트 패키지", smallestBuild: "단색 SVG 아이콘이 든 ZIP 파일 하나를 입력받아 viewBox를 같은 em 영역으로 한 번 정규화하고, 정렬된 웹폰트 패키지 ZIP 한 개를 즉시 반환한다." },
        { value: "아이콘 글리프 미리보기 표를 함께 넣기", detail: "glyph·class·codepoint를 확인할 preview HTML을 결과 ZIP에 넣는다.", resultTitle: "글리프 미리보기 포함 웹폰트 패키지", smallestBuild: "단색 SVG 아이콘이 든 ZIP 파일 하나를 입력받아 glyph 웹폰트로 한 번 변환하고, class·codepoint 미리보기 HTML이 포함된 웹폰트 패키지 ZIP 한 개를 즉시 반환한다." },
      ],
    },
  },
  {
    source_key: "trustmrr:resume-parse",
    selection_reason: "이력서 PDF 한 장을 채용 도구에 다시 입력할 후보자 구조화 파일 하나로 바꾸는 반복 채용 데이터 작업이다.",
    prior_review_feedback: "PDF에 적힌 정보만 추출하며 적합도·성격·채용 순위를 판단하지 않는다.",
    card_draft: {
      payers: [
        { value: "지원자 이력서를 직접 정리하는 소형 채용담당자", detail: "연락처·경력·기술을 채용 시트에 다시 입력하며 날짜와 회사명을 틀린다." },
        { value: "여러 고객 채용을 맡는 리크루팅 에이전시 실무자", detail: "형식이 다른 PDF를 같은 후보자 구조로 반복 정리한다." },
        { value: "이력서 업로드 기능을 검수하는 채용 서비스 개발자", detail: "실제 PDF와 파서 JSON을 수작업으로 비교한다." },
      ],
      moments: [
        { value: "새 지원자의 이력서 PDF를 받은 직후", detail: "파일 안 정보를 구조화해 다시 입력하지 않아야 한다." },
        { value: "후보자 정보를 채용 시트나 CRM에 옮기기 직전", detail: "가져올 수 있는 한 파일이 필요하다." },
        { value: "이력서 파싱 결과를 다른 담당자에게 넘기기 전", detail: "PDF에 적힌 사실과 출처 위치를 확인할 구조화 결과가 필요하다." },
      ],
      twists: [
        { value: "이름·연락처·최근 직장을 JSON으로 추출하기", detail: "기본 연락 정보와 최근 직장만 구조화한다.", resultTitle: "이력서 기본정보·최근직장 JSON 추출 파일", smallestBuild: "지원자 이력서 PDF 파일 하나를 입력받아 이름·이메일·전화번호·최근 직장을 한 번 추출하고, 해당 필드만 든 JSON 파일 한 개를 즉시 반환한다." },
        { value: "회사·직무·기간을 경력 타임라인으로 펼치기", detail: "경력 항목을 회사·직무·시작·종료일 열로 만든다.", resultTitle: "이력서 경력 타임라인 CSV 추출 파일", smallestBuild: "지원자 이력서 PDF 파일 하나를 입력받아 회사·직무·시작·종료일을 한 번 추출하고, 경력별 한 행인 CSV 파일 한 개를 즉시 반환한다." },
        { value: "기술 키워드와 나온 문장 위치를 함께 추출하기", detail: "기술명과 해당 페이지·문장만 구조화한다.", resultTitle: "이력서 기술 키워드·근거 위치 JSON", smallestBuild: "지원자 이력서 PDF 파일 하나를 입력받아 문서에 직접 적힌 기술 키워드와 페이지·문장 위치를 한 번 추출하고, 근거가 붙은 JSON 파일 한 개를 즉시 반환한다." },
      ],
    },
  },
];

const inputRows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("trustmrr:")) throw new Error(`Not TrustMRR: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (auditedKeys.has(contract.source_key)) throw new Error(`Source already audited in batches 001-014: ${contract.source_key}`);
  return {
    source_key: source.key,
    name: source.name,
    url: source.url,
    category: source.dataset,
    source_text: source.source_text,
    five_sentences: source.five_sentences,
    market_signal: source.market_signal,
    selection_reason: contract.selection_reason,
    prior_review_feedback: contract.prior_review_feedback,
    source_url: source.url,
    batch_rank: index + 1,
  };
});
if (inputRows.length !== 10 || new Set(inputRows.map((row) => row.source_key)).size !== 10) {
  throw new Error("Batch 017 must contain exactly 10 unique sources");
}

const cardRows = inputRows.map((row, index) => ({
  ...row,
  card_draft: {
    source_key: row.source_key,
    ...contracts[index].card_draft,
  },
}));
for (const row of cardRows) {
  if (row.card_draft.payers.length !== 3 || row.card_draft.moments.length !== 3 || row.card_draft.twists.length !== 3) {
    throw new Error(`${row.source_key}: card axes must be 3×3×3`);
  }
}

const inputOutput = "docs/research/idea-strong-mechanism-batch-017-input-2026-07-15.jsonl";
const cardsOutput = "docs/research/idea-strong-mechanism-batch-017-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, inputOutput), inputRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, cardsOutput), cardRows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const selectionOutput = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-017-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 017 — TrustMRR 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${inputRows.length}개`,
  "- 범위: 현재 앱 97개 및 강한 메커니즘 배치 001~014 input/card-drafts에서 제외된 trustmrr: Candidate",
  "- 게이트: Stress-3 3/3 → Latin-9 9/9 → Full-27 27/27",
  "- 앱 반영: 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...inputRows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, selectionOutput), lines.join("\n"));
console.log(JSON.stringify({ selected: inputRows.length, inputOutput, cardsOutput, selectionOutput }, null, 2));
