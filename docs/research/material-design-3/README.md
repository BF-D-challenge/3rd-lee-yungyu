---
name: material-design-3-corpus
description: Material Design 3 공식 문서를 Browser Use와 Playwright API로 수집해 페이지, 섹션, 사례, 디자인 토큰 단위로 검색할 수 있게 만든 로컬 JSONL 코퍼스.
metadata:
  type: dataset
  topic: material-design-3
  category: design-system
  date: 2026-07-10
---

# Material Design 3 Local Corpus

이 폴더는 [Material Design 3](https://m3.material.io/) 공식 문서를 로컬에서 검색하기 위한 구조화 코퍼스다. Firecrawl은 URL 사이트맵 생성에만 사용하고, 본문과 인터랙티브 Specs 데이터는 Codex 인앱 Browser의 Playwright API로 읽는다.

## Start Here

- URL 카탈로그: [urls.jsonl](urls.jsonl)
- 페이지: [pages.jsonl](pages.jsonl)
- 섹션: [sections.jsonl](sections.jsonl)
- 컴포넌트 Specs 토큰: [tokens.jsonl](tokens.jsonl)
- Do/Don't/Caution 및 예시: [examples.jsonl](examples.jsonl)
- 필드 정의: [SCHEMA.md](SCHEMA.md)
- 기계가독 매니페스트: [MANIFEST.json](MANIFEST.json)

## Collection Result

- 사이트맵 URL: 405개
- canonical URL: 403개
- 정상 추출: 397페이지
- 공식 리다이렉트로 분류: 4페이지
- 문서 본문이 없는 검색/XML 유틸리티: 2페이지
- 구조화 레코드: 페이지 403개, 섹션 3,236개, 토큰 3,151개, 예시 3,643개
- 미해결 URL: 0개

리다이렉트 목적지의 본문은 오래된 원본 URL에 귀속하지 않는다. 해당 페이지 행에는 `resolution_type`, `observed_final_url`, `resolution_reason`만 남기고 검색 본문과 자식 레코드를 제거했다. 세부 판정은 [retry/noncompleted-report.json](retry/noncompleted-report.json)에 있다.

## Collection Contract

1. `.firecrawl/m3-material-map.json`을 URL 입력으로만 사용한다.
2. 쿼리와 해시를 제거해 canonical URL을 만든다.
3. 하나의 인앱 브라우저 탭을 재사용하며 `main h1`, 본문 길이, `token-viewer` 같은 DOM 조건으로 렌더링 완료를 판단한다.
4. 일반 문서는 제목, 섹션, 문단, 목록, 링크, 이미지 설명, 예시를 추출한다.
5. Specs는 `token-viewer`의 `design-system-data`를 페이지 안에서 파싱하고 표시 대상 토큰만 정규화한다. 수십 MB 크기의 원본 속성이나 전체 HTML은 저장하지 않는다.
6. 각 레코드는 원문 URL과 수집 시각을 보존하며, 공식 지침과 프로젝트 적용 해석을 구분한다.

## Copyright Boundary

이 코퍼스의 목적은 내부 검색과 설계 판단 지원이다. 원문 페이지를 통째로 재배포하지 않고, 구조화된 사실과 짧은 문맥, 출처 링크를 저장한다. 외부에 답변할 때는 긴 원문 재현 대신 요약과 최소 인용을 사용한다.

## Refresh Workflow

1. 명시적인 갱신 요청이 있을 때만 Firecrawl `map`으로 URL 목록을 새로 만든다.
2. URL 카탈로그를 재생성하고 새 URL, 삭제 URL, 변경 URL을 분리한다.
3. Browser Use의 Playwright API로 변경 대상만 다시 읽는다.
4. `content_hash`가 바뀐 레코드만 교체하고 검증기를 실행한다.
5. `MANIFEST.json`의 수집 시각, 행 수, 실패 수를 갱신한다.

## Query Skill

저장소의 `.claude/skills/design-google`가 이 코퍼스를 조회하는 스킬 원본이다. 완성 후 `/Users/yungyulee/.agents/skills/design-google`에 동기화해 Codex 런타임에서 사용한다.
