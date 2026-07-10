---
name: material-design-3-schema
description: Material Design 3 로컬 코퍼스의 URL, 페이지, 섹션, 예시, 디자인 토큰 JSONL 필드와 참조 관계.
metadata:
  type: schema
  topic: material-design-3
  category: reference
  date: 2026-07-10
---

# Material Design 3 Corpus Schema

모든 JSONL 파일은 한 줄에 JSON 객체 하나를 저장한다. `id`는 결정적 해시로 생성하며, 원문을 다시 수집해도 같은 논리 엔터티는 같은 ID를 유지한다.

## urls.jsonl

Firecrawl 사이트맵에서 정규화한 URL 카탈로그다.

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | canonical URL 기반 ID |
| `url` | string | 쿼리·해시·불필요한 trailing slash를 제거한 URL |
| `title` | string | 사이트맵 제목 |
| `description` | string | 사이트맵 설명 |
| `category` | string | `components`, `foundations`, `styles`, `blog` 등 |
| `page_type` | string | `component_tab`, `foundation`, `style`, `blog`, `index`, `utility` 등 |
| `component` | string/null | 컴포넌트 slug |
| `tab` | string/null | `overview`, `guidelines`, `accessibility`, `specs` 등 |
| `status` | string | 수집 전 상태는 `pending` |

## pages.jsonl

URL당 정확히 한 행을 저장한다. 실패한 URL도 `status: "error"` 행을 남긴다.

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | 페이지 ID |
| `url_id` | string | `urls.jsonl.id` 참조 |
| `url`, `source_url` | string | 공식 원문 URL |
| `title`, `description` | string/null | 렌더링된 제목과 메타 설명 |
| `content` | string | 아래 검색 텍스트 정책으로 결합한 제목·섹션·링크·예시 텍스트 |
| `category`, `page_type`, `component`, `tab` | string/null | URL 카탈로그 분류 |
| `status` | string | `completed`, `partial`, `error` |
| `captured_at` | string | ISO 8601 수집 시각 |
| `content_hash` | string | 아래 정규화 입력의 결정적 SHA-256 |
| `main_text_length` | number | 렌더링된 `main` 텍스트 길이 |
| `section_count`, `token_count`, `example_count` | number | 자식 레코드 수 |
| `error` | object/null | 단계별 구조화 오류 |
| `resolution_type` | string/null | 확인된 비문서 상태: `redirect` 또는 `utility` |
| `observed_final_url` | string/null | 리다이렉트가 실제로 도착한 공식 URL |
| `resolution_reason` | string/null | 재시도 후 확정한 분류 근거 |
| `official_destination` | boolean/null | 목적지가 공식 Material/Android 문서인지 여부 |

`resolution_type`이 있는 오류 페이지는 재시도 완료 상태다. 리다이렉트 목적지의 본문을 오래된 원본 URL에 귀속하지 않기 위해 `content`와 모든 자식 레코드를 비우며, `error.retryable`은 `false`로 저장한다.

## sections.jsonl

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | 섹션 ID |
| `page_id` | string | `pages.jsonl.id` 참조 |
| `source_url` | string | 공식 원문 URL |
| `index` | number | 페이지 안 표시 순서 |
| `heading`, `level` | string/null, number/null | 섹션 제목과 heading level |
| `heading_path` | string[] | 상위 제목을 포함한 경로 |
| `text` | string | 문단과 목록을 결합한 검색 텍스트 |
| `paragraphs` | string[] | 문단 배열 |
| `lists` | object[] | 순서 여부와 항목 배열 |
| `links` | object[] | 링크 텍스트와 URL |
| `example_count` | number | 이 섹션을 참조하는 예시 수 |
| `has_payload` | boolean | 제목 외 검색 가능한 본문·목록·의미 있는 링크 텍스트 또는 예시가 있으면 `true` |

## examples.jsonl

Figure와 Do/Don't/Caution 같은 시각·행동 예시다.

| Field | Type | Description |
| --- | --- | --- |
| `id`, `page_id`, `section_id` | string/null | 예시와 부모 참조 ID |
| `source_url` | string | 공식 원문 URL |
| `kind` | string | `figure`, `do`, `dont`, `caution` |
| `media_type`, `media_url`, `image_url` | string/null | 이미지·영상 정보 |
| `alt`, `caption`, `text` | string/null | 접근성 설명과 캡션 |
| `media_only` | boolean | 미디어 URL은 있지만 `alt`, `caption`, `text`가 모두 비어 있을 때만 `true`; 설명을 추측해서 채우지 않음 |
| `media_variant` | string | 저장된 미디어 URL이 정확히 `=w40`으로 끝날 때 `thumbnail`; 대체 URL을 추측하지 않음 |

## tokens.jsonl

Specs의 `token-viewer`가 실제로 표시하도록 지정한 토큰 세트만 저장한다. 원본 `design-system-data` 속성은 저장하지 않는다.

| Field | Type | Description |
| --- | --- | --- |
| `id`, `page_id` | string | 토큰과 부모 페이지 ID |
| `source_url` | string | Specs 원문 URL |
| `viewer_index` | number | 페이지 내 token viewer 순서 |
| `token_set`, `token_set_name`, `token_set_type` | string/null | 표시 토큰 세트 정보 |
| `group`, `group_order`, `order` | string/number/null | Specs 표시 그룹과 순서 |
| `name`, `display_name`, `description` | string/null | 토큰 이름과 설명 |
| `type` | string/null | color, dimension 등 값 타입 |
| `deprecated`, `deprecation_message` | boolean, string/null | 폐기 여부와 안내 |
| `value` | object[] | context tag, 참조 토큰, 압축된 직접 값 |

## Searchable Page Content

`pages.content`는 다음 후보를 순서대로 읽어 만든다.

1. 페이지 `title`, `description`
2. 섹션 `index` 순서로 `heading`, `text`; `text`가 비어 있으면 `paragraphs`와 `lists[].items`
3. 각 섹션의 의미 있는 `links[].text`
4. 예시 `index` 순서로 `caption`, `alt`, `text` 중 첫 번째 비어 있지 않은 값
5. 앞선 후보가 하나도 없을 때만 `tokens[].name`

링크 텍스트는 공백이 아니고 유니코드 문자나 숫자를 하나 이상 포함해야 한다. 원문 URL 자체(`http://`, `https://`, `www.`)와 `click here`, `here`, `learn more`, `link`, `menu`, `more`, `read more` 같은 단독 범용 레이블은 제외한다.

모든 후보는 공백을 한 칸으로 정규화한 문자열을 중복 키로 사용한다. 대소문자는 구분하며, 먼저 나온 원문만 보존하고 최종 항목은 빈 줄 두 개(`\n\n`)로 연결한다.

과거 코퍼스의 아이콘 없는 `Caution`, `Do`, `Don’t` 레이블은 새 파생 필드가 없는 레거시 입력을 처음 정규화할 때 한 번만 제거한다. 이후 실행과 새 추출에서는 아이콘까지 포함한 원시 접두사를 추출 단계에서 제거하므로, 실제 문장이 `Do`나 `Don’t`로 시작해도 반복 실행에서 다시 잘리지 않는다.

## content_hash Input

`content_hash`는 저장이 끝난 정규화 페이지와 그 페이지의 섹션·토큰·예시로 다음 객체를 만든 뒤 SHA-256으로 계산한다.

```json
{
  "page": "normalized page record",
  "sections": ["normalized child record"],
  "tokens": ["normalized child record"],
  "examples": ["normalized child record"]
}
```

정확한 입력 규칙은 다음과 같다.

- 각 최상위 레코드에서 `id`, 이름이 `_id`로 끝나는 모든 참조 필드, `captured_at`, `error`, `content_hash`를 제외한다. `url`과 `source_url`을 포함한 나머지 저장 필드는 모두 포함한다.
- 각 자식 레코드를 위 규칙으로 필터링한 뒤, 키를 정렬한 안정 JSON 문자열로 변환해 문자열 오름차순으로 정렬한다. 따라서 JSONL 행 순서와 레코드 참조 ID는 해시에 영향을 주지 않는다.
- 위 객체도 재귀적으로 객체 키를 정렬한 안정 JSON으로 직렬화하고 UTF-8 바이트의 SHA-256 소문자 16진수 값을 저장한다.
- `captured_at` 또는 `error`만 달라진 재수집과 같은 입력에 대한 정규화 재실행은 같은 해시를 만든다.

## Integrity Rules

- `urls.jsonl` canonical URL은 403개이며 중복이 없어야 한다.
- 모든 URL은 `pages.jsonl`에 정확히 한 번 나타나야 한다.
- `completed` 페이지는 빈 `content`를 가질 수 없다.
- 모든 섹션·예시·토큰의 `page_id`는 존재하는 페이지를 참조해야 한다.
- Specs 페이지가 토큰을 노출했는데 `token_count`가 0이면 검수 대상으로 남긴다.
- `section_count`, `token_count`, `example_count`와 섹션 `example_count`는 실제 자식 레코드 수와 일치해야 한다.
- 원문 근거를 제시할 때 `source_url`과 `captured_at`을 함께 사용한다.
