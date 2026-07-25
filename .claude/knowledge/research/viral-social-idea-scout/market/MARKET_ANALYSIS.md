# 경쟁 제품과 플랫폼 접근성

## 경쟁 제품 지도

### 1. YouTube outlier → 콘텐츠 아이디어

- [1of10](https://1of10.com/features): 채널 평균보다 10~100배 성과를 낸 영상을 찾고, 이를 기반으로 아이디어·제목·썸네일을 만든다고 설명한다.
- [Viewstats](https://www.viewstats.com/info): 실시간 YouTube 데이터로 트렌드·경쟁자·outlier·썸네일을 분석한다.
- [vidIQ Daily Ideas](https://vidiq.com/en-US/features/daily-ideas/): 유사 채널, 자신의 영상 이력, 트렌드를 바탕으로 매일 개인화된 영상 아이디어와 상대적 조회 가능성 평가를 제공한다.
- [Outlier](https://outlier.so/features/ai-video-ideas): YouTube outlier 데이터에서 훅과 아이디어를 생성한다.

이 영역에서 단순히 `바이럴 영상 → 새 영상 아이디어`를 만들면 이미 강한 제품들과 정면 경쟁한다.

### 2. 여러 숏폼 플랫폼 추적

- [Shortimize](https://features.shortimize.com/en/help/articles/2674205-what-platforms-accounts-and-content-types-does-shortimize-support): TikTok, Instagram Reels, YouTube Shorts, Facebook, Snapchat, X 영상을 추적한다고 밝힌다. 공개 계정 URL을 입력하는 방식이며 텍스트 게시물은 다루지 않는다.
- [ViewRank AI](https://viewrankai.com/): Instagram·TikTok의 성과가 좋은 콘텐츠를 찾아 자기 분야의 콘텐츠 아이디어로 바꾼다.
- [Viral Ideas](https://viralideas.ai/): Instagram Reels의 훅·구조·CTA를 분석하고 스크립트와 영상 제작으로 연결한다.
- [vidIQ for Instagram](https://vidiq.com/blog/post/vidiq-for-instagram/): 공개 Instagram 핸들에서 Reels를 분석하고 트렌드 기반 아이디어를 생성한다.

따라서 `여러 플랫폼을 한 화면에서 찾는다`도 그 자체로는 차별화가 약하다.

### 3. 커뮤니티 신호 → 스타트업 아이디어

- [IdeaMiner](https://www.ideaminer.io/): Reddit·Hacker News·Product Hunt·G2 리뷰에서 아이디어를 찾고 PRD까지 연결한다.
- [IdeaSift](https://ideasift.io/): 대화와 댓글에서 반복되는 문제를 추출해 제품 아이디어로 바꾼다.
- [FounderIQ](https://www.tryfounderiq.com/ai-startup-idea-generator): Reddit·GitHub·Hacker News·Product Hunt 신호에서 아이디어와 실행 자료를 만든다고 설명한다.
- [Idea Crawl](https://ideacrawl.com/): Reddit·X·Product Hunt·앱 리뷰 등에서 불편 표현을 찾아 사업 아이디어로 전환한다.

현재 Idea Lab과 가장 가까운 경쟁축이다. 차별점은 `많은 아이디어`가 아니라 한국 사용 맥락, 원본 메커니즘 보존, 한 끗 변화, 실제 제작 행동까지 이어지는 인터랙션이어야 한다.

## 플랫폼별 구현 난이도

| 플랫폼 | 공식 데이터 가능성 | MVP 판단 | 이유 |
|---|---|---|---|
| YouTube | 높음 | 먼저 시작 | 공식 API가 지역·카테고리별 `mostPopular`와 공개 영상 통계를 제공한다. 채널별 기준선을 계산하기도 상대적으로 쉽다. |
| X | 중간 | URL 붙여넣기 | 공식 API 검색이 가능하지만 현재 pay-per-usage이며 읽기량에 비용이 붙는다. 비공식 로그인 기반 수집은 깨지기 쉽다. |
| Instagram | 낮음~중간 | URL·계정 제한 | 공식 API의 중심은 인증한 프로 계정 관리다. 소비자 계정 접근은 안 되고, 공개 탐색은 권한·앱 심사·기능 제한을 고려해야 한다. |

### YouTube 근거

[YouTube Data API `videos.list`](https://developers.google.com/youtube/v3/docs/videos/list)는 `chart=mostPopular`, `regionCode`, `videoCategoryId`를 지원하고 공개 영상의 조회·좋아요·댓글 통계를 제공한다. 다만 2025년 3월 31일부터 Shorts의 조회수는 재생·재재생 시작 횟수로 집계되므로 롱폼과 같은 기준으로 비교하면 안 된다.

### X 근거와 수집 실패

[X API Usage and Billing](https://docs.x.com/x-api/fundamentals/post-cap)은 API v2가 pay-per-usage이고 최근·전체 검색의 읽기량이 과금 대상이라고 명시한다. 이번 조사에서는 인증된 `twitter-cli`의 `whoami`는 성공했지만 검색이 HTTP 404로 반복 실패했다. 로그인 쿠키 기반 비공식 검색을 핵심 인프라로 쓰면 이와 같은 변동성을 제품이 떠안는다.

### Instagram 근거

[Meta의 Instagram API 공식 Postman 문서](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)는 프로 계정의 미디어·댓글·인사이트 관리가 중심이며, Facebook Login 방식은 일반 소비자 계정에 접근할 수 없다고 명시한다. 해시태그 미디어와 다른 프로 계정의 기본 메타데이터는 일부 가능하지만, 전 플랫폼의 공개 바이럴 피드를 안정적으로 수집하는 범용 검색 API로 보기는 어렵다.

## 구현 원칙

1. 자동으로 전 플랫폼을 긁기 전에 사용자가 URL을 붙여넣거나 운영자가 큐레이션한다.
2. 원문 전문을 복제 저장하지 않고 링크·썸네일·허용된 메타데이터·추출 근거를 저장한다.
3. 절대 조회수 대신 채널 기준 outlier, 게시 후 속도, 댓글의 반복 문제 표현을 분리 계산한다.
4. `바이럴 이유`와 `제품 기회`를 별도 필드로 두고 AI의 추론을 사실처럼 섞지 않는다.
5. 플랫폼 하나·분야 하나에서 제작 시작률을 확인한 뒤 확장한다.
