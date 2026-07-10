---
name: moonlight-ref--index
description: app.moonlight.world(온라인 타로 앱)에서 추출한 "오늘 해볼까" 아웃풋 UI 스타일 레퍼런스 에셋 3종 안내 — 드롭인 디자인 토큰 CSS, 6축 카드 뽑기 인터랙션 단일 파일 데모 HTML, 리서치 층화샘플 기반 6축 134장 카드 데이터 JS.
metadata:
  type: reference
  topic: moonlight-ref
  category: index
  date: 2026-07-08
---

# moonlight-ref — Moonlight 스타일 레퍼런스 에셋

app.moonlight.world 라이브 DOM에서 실측·추출(2026-07-05)한 "오늘 해볼까" 아웃풋 UI의 디자인/인터랙션 원형. 코드가 아니라 **레퍼런스**다 — 제품 반영 시 여기 값을 옮겨 쓰되, 이 파일들 자체를 import하지 않는다.

전체 지도: [../INDEX.md](../INDEX.md)

| 파일 | 설명 |
|---|---|
| [moonlight-tokens.css](moonlight-tokens.css) | 드롭인 디자인 토큰. 폰트(Work Sans / Playfair Display / Pinyon Script — 원본 상용 폰트의 무료 대체), 컬러(`#f5f5f5` 배경·`#ecd8ce` 결과카드·`#b288f6` 퍼플글로우 등), radius(버튼9~패널31), 시그니처 하드 오프셋 그림자 `0 3px 0 0 #000`, 카드 flip 값(perspective 1200px, 비율 300:485, `cubic-bezier(.65,0,.35,1)`). |
| [moonlight-interaction.html](moonlight-interaction.html) | 6축 카드 뽑기 인터랙션 단일 파일 데모(폰트 base64 임베드, 의존성 없음 — 브라우저로 바로 열면 됨). 밀집 부채꼴 팬덱, 탭/드래그→슬롯, 앵커 친화도 가중 뽑기, 카드 고정(🔒)+리롤(v7)까지의 진화가 담긴 원형. |
| [axes-data.js](axes-data.js) | trustmrr(1,863건)+App Store 리서치를 층화샘플해 만든 6축(누가/고민/장면/모양/방법/마음) 134장 카드 데이터. 카드마다 label·keywords·도메인 태그(`d`)를 가지며, 앵커 친화도 가중 뽑기의 입력이다. |
| [moonlight-freeform.gif](moonlight-freeform.gif) | Moonlight 인터랙션 화면 녹화 GIF(2.2MB, 2026-07-08 추가) — 움직임 레퍼런스. |

## 배경

- 왜 Moonlight인가: 결과 카드 + 카드 뒤집기 UX가 "오늘 뭘 해볼까?" 아이디어 공개 순간에 그대로 맞아서. 앞면 아트는 저작권 회피를 위해 자체 제작(→ [../card-art-prompting/](../card-art-prompting/)).
- 카드 데이터의 원천: [../trustmrr-acquire/](../trustmrr-acquire/) · [../store-rankings/](../store-rankings/)
