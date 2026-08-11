# 맛핀

Instagram에서 발견한 맛집, 카페와 여행지 게시물을 `matpin.kr`에 보내면 장소를 찾아 가까운 역별 개인 보관함에 정리하는 서비스입니다.

2026-08-10 기준으로 앱 역할 계정을 위한 비공개 베타를 운영하고 있습니다. 관리자 CRM은 로컬 구현과 운영 Supabase 마이그레이션 7개를 확인했지만 아직 운영에 배포하지 않았고, 실제 Google 로그인과 실대화도 검증하지 않았어요. Meta 메시지 권한은 테스트 준비 완료 상태이며 앱 검수에 제출하지 않았습니다. 일반 공개 전에는 고급 액세스 승인과 앱 역할이 없는 일반 계정 왕복을 확인해야 해요. 최신 운영 판정은 [운영 가이드](docs/matpin/OPERATIONS.md)에서 관리합니다.

## 지원 범위

| 입력 | 동작 |
| --- | --- |
| 공개 Instagram 릴스 | 장소를 분석하고 보관함에 저장합니다. |
| 공개 피드 게시물과 캐러셀 | 게시물 또는 미리보기를 분석하고 장소를 저장해요. |
| 개별 Instagram 게시물 URL | URL만 단독으로 보냈을 때 처리합니다. |
| 같은 게시물 재공유 | 영구 분석 캐시를 재사용하고 AI 분석 비용을 다시 쓰지 않아요. |
| 직접 보낸 글, 사진과 동영상 | 분석하거나 저장하지 않고 올바른 사용 방법을 답장합니다. |
| 프로필과 외부 링크 | 저장하지 않고 개별 Instagram 게시물을 보내달라고 안내해요. |

## 주요 화면

- 서비스 안내: <https://matpin-kr.vercel.app/matpin>
- 개인 보관함: `/s/{code}` 또는 `/matpin/saved#token=...`
- 내 데이터 관리: `/matpin/delete`
- 운영 CRM: `/matpin/admin` (배포 및 운영 검증 대기)

운영 CRM은 확인된 Google 이메일과 `MATPIN_ADMIN_EMAILS` 허용목록으로 보호됩니다. 실제 관리자 Google 이메일을 확정해 배포 환경에 등록해야 하며, 허용목록이 비어 있으면 모든 관리자 접근을 거부해요. 조회 시간 예산, 불확실한 발송의 중복 차단과 자동 답장 1,000바이트 제한은 수정 및 로컬 검증을 마쳤습니다. 운영 배포와 허용 계정 로그인 전까지는 운영 완료 상태가 아닙니다.

## 로컬 실행

```bash
npm install
npm run dev
```

기본 주소는 <http://localhost:3000/matpin>입니다. 실제 비밀값은 `.env.example`의 이름만 참고해 로컬 `.env`와 Vercel 환경 변수에 등록하고, 저장소에는 올리지 않습니다.

## 검증

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run lint
npm run build
npm run matpin:launch:check -- https://matpin-kr.vercel.app
```

실행한 검증만 완료로 기록합니다. 운영 배포는 커밋과 배포 완료 표시뿐 아니라 운영 별칭과 실제 화면까지 확인해야 해요.

## 문서

- [맛핀 문서 허브](docs/matpin/README.md)
- [제품 요구사항](docs/PRD.md)
- [현재 작업과 출시 게이트](docs/TASK.md)
- [프로젝트 구조](docs/PROJECT_STRUCTURE.md)
- [기술 구조와 개인정보 경계](docs/matpin/ARCHITECTURE.md)
- [운영 및 배포 가이드](docs/matpin/OPERATIONS.md)
- [제품 설계 계약](.design-architect/PRODUCT.md)
- [경험 설계 계약](.design-architect/EXPERIENCE.md)
- [화면 설계 계약](.design-architect/DESIGN.md)

활성 문서는 맛핀만 다룹니다. 기존 리서치와 실험 파일은 근거 보존을 위해 삭제하지 않았으며, 현재 제품 판단의 정본으로 사용하지 않습니다.

별도 로컬 산출물인 발표 C안은 `outputs/presentation-candidates/`에 있고 Git에서 무시됩니다. 개인정보 가림, 9장과 240초 구성, 데스크톱 및 모바일 브라우저 재QA를 마쳤어요. Moonlight 카드 상호작용도 로컬 HTTP에서 실제 포인터 동작을 검증했습니다. 과거 Onebite와 Today 확장 시안은 현재 맛핀 정본과 충돌하므로, 제품 방향을 다시 결정하기 전에는 재개하지 않습니다.
