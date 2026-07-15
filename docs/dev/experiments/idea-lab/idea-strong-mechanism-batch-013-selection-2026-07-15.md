# 강한 메커니즘 배치 013 — Chrome 전문 변환·검사 10개

- 카드 작성 대상: 10개
- 앱 포트폴리오 기준: 89개 원본
- 제외: 앱 source key, strong-mechanism 001~011 input/card-drafts, 그 밖의 모든 기존 card-drafts
- 우선순위: 입력 1개 → 전문 처리 1회 → 검증 가능한 파일·페이지 상태 1개
- 앱 반영: 하지 않음

| 순서 | 원본 | 선택 이유 |
|---:|---|---|
| 1 | SelectorsHub | HTML 요소 한 개에서 실제로 검증된 Playwright·XPath·CSS locator를 만드는 전문 자동화 결과다. |
| 2 | API Recorder | 웹 앱 URL 하나를 한 번 열어 발생한 API 호출을 재현 가능한 정적 파일로 내보내는 개발 QA 메커니즘이다. |
| 3 | GitZip for github | 공개 GitHub 하위 폴더 URL 하나를 저장소 전체 clone 없이 구조가 보존된 ZIP 한 개로 만든다. |
| 4 | Design Analyzer - Extract Design Elements | 웹사이트 URL 하나에서 눈대중이 아닌 재사용 가능한 색상·글꼴·간격 토큰 파일을 추출한다. |
| 5 | Fake Filler | 공개 폼 URL 하나의 입력 타입을 읽어 테스트 가능한 더미 값으로 한 번 채우는 반복 QA 작업이다. |
| 6 | YouTube Tag Extractor | YouTube URL 하나에서 공개 메타데이터의 숨은 태그를 추출해 바로 비교 가능한 목록 파일로 만든다. |
| 7 | Download All Images | 웹페이지 URL 하나에서 필요한 이미지 규격만 골라 구조가 단순한 ZIP 한 개로 내려받는 자료 수집 도구다. |
| 8 | HTML to Figma: Convert Websites into Designs & Wireframes by Wireframeit | 공개 웹페이지 URL 하나를 재작업 가능한 디자인·와이어프레임 파일로 변환하는 전문 디자인 역설계 결과다. |
| 9 | Needle Inspector — DevTools & MCP for three.js | 공개 three.js 데모 URL 하나에서 눈에 보이지 않는 scene hierarchy와 속성 근거를 정적 보고서로 뽑는다. |
| 10 | Cookie Manager Pro | 현재 사이트 쿠키를 값 노출 없이 유형별로 정리한 재현용 JSON 프로필 한 개로 내보내는 개발 지원 결과다. |
