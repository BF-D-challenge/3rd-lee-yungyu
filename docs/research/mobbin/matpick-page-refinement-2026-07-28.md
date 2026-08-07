# MATPICK 지도 페이지 개선 결정

- 기준일: 2026-07-28
- 현재 단계: 첫 결과 확인 → 장소 선택 → 언급 영상 재생 → 저장/길찾기
- 주 디자인: Google Maps
- 행동 구조 참고: Uber Eats, DoorDash, Beli
- 기존 캡처·OCR 증거 재사용: `tastepin-mobile-nearby-video-2026-07-27`

## 레퍼런스

| 레퍼런스 | 관찰 | MATPICK 적용 |
| --- | --- | --- |
| [Google Maps](https://mobbin.com/flows/fc8dfce3-bd09-4346-9a97-441f0948cf53) | 중립적인 지도, 작은 필터, 파란 선택 상태, 지도와 상세 카드의 직접 연결 | 전체 시각 체계와 지도 우선 구조를 유지 |
| [Uber Eats](https://mobbin.com/flows/177464d4-adc2-418b-bcec-4eca4abfe36e) | 실제 음식 이미지를 목록의 첫 정보로 사용 | 번호 박스를 실제 언급 영상 썸네일로 교체 |
| [DoorDash](https://mobbin.com/flows/487f768e-3275-4509-ab96-a61fc22ce3cd) | 지도 제어는 적게 두고 상세 행동은 카드에 집중 | 저장·길찾기·영상 재생을 선택 카드에 유지 |
| [Beli](https://mobbin.com/flows/3255694a-faad-444f-914d-4b7c82083fa6) | 저장 목록과 추가 행동을 한 화면에서 제공 | 목록·저장 구조만 참고하고 목록 우선 화면은 사용하지 않음 |

## 적용 결정

1. 큰 홍보형 컬렉션 카드를 제거하고 Google Maps처럼 평평하고 조밀한 제목 영역으로 바꾼다.
2. 현재 위치 요청은 자동으로 띄우지 않고 사용자가 `현재 위치에서 다시 정렬`을 누른 뒤에만 요청한다.
3. 장소 행의 가짜 번호 이미지를 실제 YouTube 언급 영상 썸네일로 교체한다.
4. 헤더의 다음 결과가 분명하도록 `장소 추가`를 `영상 추가`로 바꾼다.
5. Instagram 자동 수집이 연결되지 않았다는 사실은 한 번만 짧게 안내한다.

![Google Maps 증거](assets/tastepin-mobile-nearby-video-2026-07-27/google-maps-strip.jpg)

![Uber Eats 증거](assets/tastepin-mobile-nearby-video-2026-07-27/uber-eats-strip.jpg)

![DoorDash 증거](assets/tastepin-mobile-nearby-video-2026-07-27/doordash-strip.jpg)

![Beli 반례](assets/tastepin-mobile-nearby-video-2026-07-27/beli-strip.jpg)
