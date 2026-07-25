---
name: appsprint-postback--index
description: AppSprint ASO와 Postback 공개 블랙박스 리버스 엔지니어링 코퍼스 안내 — 제품 관계, 핵심 플로우, 공개 API·SDK·MCP, 가격·성장 루프, 기술 구조, 관찰된 리스크와 오늘 해볼까 적용점을 SUMMARY.md로 연결한다.
metadata:
  type: research
  topic: appsprint-postback
  category: index
  date: 2026-07-21
---

# AppSprint ASO + Postback 리버스 엔지니어링

공개 웹 페이지, 공식 문서, 공개 API, 브라우저 네트워크, 공개 클라이언트 번들, 공식 패키지 레지스트리를 기준으로 두 제품을 분석한 코퍼스다.

## 먼저 읽을 문서

- [SUMMARY.md](SUMMARY.md) — 제품·UX·비즈니스·기술 구조 통합 분석과 재구현 청사진.

## 조사 범위

- AppSprint ASO: 랜딩, 무료 키워드 도구, macOS 앱 문서, App Store Connect·Apple Ads 연동, 로컬 MCP, 결제·퍼널 구조.
- Postback: 랜딩 인터랙티브 데모, 앱 추가·로그인 흐름, SDK·RevenueCat·Apple Search Ads·TikTok 문서, 가격 모델, 공개 패키지와 운영 상태.
- 두 제품의 관계: `appsprint.app/attribution/*`가 `postback.sh`로 리디렉션되는 마이그레이션 경로와 동일 운영사 확인.

## 한계

- 공개 블랙박스 분석이다. AppSprint DMG 디컴파일, 라이선스·기기 제한 우회, 인증 계정 내부 데이터 접근은 하지 않았다.
- Postback 로그인 이후 실제 대시보드는 접근하지 않았고, 공개 랜딩의 인터랙티브 데모와 공식 문서로 정보 구조를 교차검증했다.

