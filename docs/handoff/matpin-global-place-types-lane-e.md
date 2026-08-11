# Matpin Lane E: 글로벌 장소 유형 확장

2026-08-11 기준 로컬 구현 및 bounded 검증 기록입니다. 이 문서는 배포 완료나 운영 실험 완료를 의미하지 않습니다.

## 이번 작업에서 구현한 것

- 장소 유형을 `restaurant`, `cafe`, `attraction`, `lodging`으로 표현할 수 있게 분석 단서와 장소 후보 JSON에 선택 필드를 추가했습니다. 기존 저장 JSON은 필드가 없어도 계속 읽습니다.
- Google Places 검색에서 카페, 관광지, 숙소는 `includedType`과 엄격한 타입 필터를 사용합니다.
- 일본 입력은 Google Places에 일본어 결과 언어를 요청하고, 후보에 `countryCode: JP`와 도시 및 지역 이름을 기록합니다.
- 국내 Kakao Local 결과는 `FD6`, `CE7`, `AT4`, `AD5` 유형을 후보 유형으로 변환할 수 있습니다.
- 해외 후보에 확인된 교통 정보가 없으면 서울 역 좌표로 계산하지 않고 국가와 지역 그룹으로 남깁니다.
- 장소 유형과 지역 계약이 달라졌으므로 분석 캐시 키를 `global-place-types-v1:{mediaKey}`로 분리하고, 기존 무버전 캐시는 다음 마이그레이션에서 무효화합니다.

## 검증한 입력

`tests/fixtures/matpin-global-place-inputs.ts`의 실제 장소명과 일본 지역 입력으로 다음을 검증했습니다.

- 일본 카페, 도쿄 기요스미시라카와, `cafe`
- 일본 관광지, 도쿄 아사쿠사, `attraction`
- 일본 숙소, 도쿄 신주쿠, `lodging`

외부 API 호출은 하지 않고, Google Places 응답 형태를 고정한 provider fixture로 요청 언어, 타입 필터, 후보의 국가 코드와 지역 이름을 검사했습니다.

## 남은 작업

- 일본을 포함한 실제 Google Places 및 Instagram 공유 end-to-end 발송 검증은 자격 증명과 실제 테스트 계정이 필요합니다.
- 해외 가까운 역은 아직 provider 검색으로 채우지 않습니다. 확인된 교통 후보를 저장하는 API 호출과 UI 표시가 별도 작업입니다.
- 운영 Supabase에 마이그레이션을 적용하거나 Vercel에 배포하지 않았습니다.
