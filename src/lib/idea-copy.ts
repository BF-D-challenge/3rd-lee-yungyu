import { josa, type JosaPair } from "./josa";

const trimSentence = (value: string) => value.trim().replace(/[.。]+$/u, "").trim();

const withParticle = (value: string, pair: JosaPair) => {
  const marked = josa(value, pair);
  if (!marked.includes("(")) return marked;
  const [, fallback] = pair.split("/");
  return `${value}${fallback}`;
};

const STRUCTURED_SOURCE =
  /^구체적인 입력:\s*(.+?)\.\s*핵심 처리:\s*(.+?)\.?$/u;
const STRUCTURED_BUILD =
  /^구체적인 입력:\s*(.+?)\.\s*를 넣으면\s*(.+?)\s*후\s*즉시 결과:\s*(.+?)\.?$/u;
const AUDIT_LABEL = /^(?:구체적인 입력|핵심 처리|즉시 결과|필요한 순간):\s*/u;
const STRUCTURED_DIFFERENCE =
  /^원본의 입력→처리→결과 흐름을 유지하면서\s*(.+?)만 적용합니다\.?$/u;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 전수검사 필드명을 제거하고 원본 제품 메커니즘을 읽기 쉬운 한 줄로 바꾼다. */
export function normalizeIdeaSource(value: string) {
  const match = STRUCTURED_SOURCE.exec(value.trim());
  if (!match) return value;
  const input = trimSentence(match[1]);
  const process = trimSentence(match[2]);
  return `${withParticle(input, "을/를")} 받아 ${process}하는 도구`;
}

/** 전수검사 조립 문구를 사용자에게 보여줄 한 문장 UVP로 바꾼다. */
export function normalizeIdeaBuild(value: string, platformLabel: string) {
  const match = STRUCTURED_BUILD.exec(value.trim());
  if (!match) return value;
  const input = trimSentence(match[1]);
  const change = trimSentence(match[2]);
  const result = trimSentence(match[3]);
  return `“${input}”만 넣으면 ${withParticle(result, "이/가")} 바로 나오는 ${platformLabel} 화면. ${change}`;
}

/**
 * 결과 카드에서는 구현 컨테이너보다 사용자가 넣는 것과 손에 남는 결과를 먼저 말한다.
 * 전수감사용 구조 문구는 변화 설명을 훅에 맡기고 입력 1개 → 결과 1개만 남긴다.
 */
export function normalizeIdeaHeroMechanism(value: string) {
  const structured = STRUCTURED_BUILD.exec(value.trim());
  if (structured) {
    const input = trimSentence(structured[1]);
    const result = trimSentence(structured[3]);
    return `“${input}” 하나만 넣으면 ${withParticle(result, "이/가")} 바로 나옵니다.`;
  }

  const normalized = normalizeIdeaHeroSentence(value);
  const readable = normalized
    .replace(/입력받아/gu, "넣으면")
    .replace(/\s+한 번\s+/gu, " ")
    .replace(/\s+즉시\s+/gu, " ");
  const tailwindDiff =
    /^`공개 URL#CSS selector\|(.+?)=값` 텍스트 한 덩어리를 (?:입력받아|넣으면) 현재 class를 (?:한 번 )?읽고,\s*(.+?) 파일 한 개를 (?:즉시 )?반환한다$/u
      .exec(readable);
  if (tailwindDiff) {
    return `URL·selector와 ${tailwindDiff[1]} 값을 넣으면 ${tailwindDiff[2]} 파일이 나옵니다.`;
  }

  const relativeEndings: Array<[RegExp, string]> = [
    [/\s+나오는\s+(?:(?:모바일|로컬 처리)\s+)?웹 화면$/u, " 나옵니다."],
    [/\s+나오는\s+모바일 화면$/u, " 나옵니다."],
    [/\s+보여주는\s+(?:(?:모바일|브라우저|읽기 전용)\s+)?(?:웹 |확장 )?화면$/u, " 보여줍니다."],
    [/\s+표시되는\s+(?:(?:모바일|브라우저)\s+)?(?:웹 |확장 )?화면$/u, " 표시됩니다."],
    [/\s+채워지는\s+모바일 웹 화면$/u, " 채워집니다."],
    [/\s+붙는\s+(?:모바일 )?웹 화면$/u, " 붙습니다."],
    [/\s+만들어지는\s+모바일 화면$/u, " 만들어집니다."],
    [/\s+생성되는\s+웹 화면$/u, " 생성됩니다."],
    [/\s+저장되는\s+(?:모바일 )?웹 화면$/u, " 저장됩니다."],
    [/\s+종료되는\s+(?:모바일 )?웹 화면$/u, " 종료됩니다."],
    [/\s+뜨는\s+(?:모바일 )?(?:웹 )?화면$/u, " 뜹니다."],
    [/\s+보이는\s+(?:모바일 )?(?:웹 |공유 )?화면$/u, " 보입니다."],
    [/\s+생기는\s+웹 화면$/u, " 생깁니다."],
    [/\s+흐르는\s+모바일 화면$/u, " 흐릅니다."],
    [/\s+고르는\s+모바일 웹 화면$/u, " 고릅니다."],
    [/\s+푸는\s+웹 화면$/u, " 풉니다."],
    [/\s+남는\s+(?:모바일 )?웹 화면$/u, " 남습니다."],
    [/\s+닫히는\s+모바일 웹 화면$/u, " 닫힙니다."],
    [/\s+알려주는\s+웹 화면$/u, " 알려줍니다."],
    [/\s+받는\s+(?:모바일 )?웹 화면$/u, " 받습니다."],
    [/\s+내려받는\s+웹 화면$/u, " 내려받습니다."],
    [/\s+만드는\s+(?:모바일 )?웹 화면$/u, " 만듭니다."],
    [/\s+비교하는\s+웹 화면$/u, " 비교합니다."],
    [/\s+확인하는\s+(?:모바일 )?웹 화면$/u, " 확인합니다."],
    [/\s+보는\s+(?:모바일 )?웹 화면$/u, " 확인합니다."],
    [/\s+재생하는\s+모바일 화면$/u, " 재생합니다."],
    [/\s+기록하는\s+웹 화면$/u, " 기록합니다."],
    [/\s+붙이는\s+(?:웹|확장) 화면$/u, " 붙입니다."],
    [/\s+종료하는\s+모바일 웹 화면$/u, " 종료합니다."],
    [/\s+반환하는\s+웹 화면$/u, " 반환합니다."],
    [/\s+제공하는\s+웹 화면$/u, " 제공합니다."],
    [/\s+제외할 수 있는\s+웹 화면$/u, " 제외할 수 있습니다."],
    [/\s+([^\s]+)\s+수 있는\s+웹 화면$/u, " $1 수 있습니다."],
    [/\s+내보내는\s+웹 화면$/u, " 내보냅니다."],
    [/\s+바꿔주는\s+웹 화면$/u, " 바꿔줍니다."],
    [/\s+묶는\s+웹 화면$/u, " 묶습니다."],
    [/\s+([가-힣A-Za-z]+)하는\s+(?:모바일 )?웹 화면$/u, " $1합니다."],
  ];

  for (const [pattern, replacement] of relativeEndings) {
    if (pattern.test(readable)) return readable.replace(pattern, replacement);
  }

  const completed = readable
    .replace(/한다$/u, "합니다")
    .replace(/된다$/u, "됩니다")
    .replace(/준다$/u, "줍니다")
    .replace(/낸다$/u, "냅니다")
    .replace(/받는다$/u, "받습니다")
    .replace(/남는다$/u, "남습니다")
    .replace(/있다$/u, "있습니다");
  return /[.!?]$/u.test(completed) ? completed : `${completed}.`;
}

/** 카드 감사용 접두어를 지우되 입력 → 처리 → 결과 순서는 보존한다. */
export function normalizeIdeaFlow(value: string) {
  return value
    .split("→")
    .map((step) => trimSentence(step.trim().replace(AUDIT_LABEL, "")))
    .filter(Boolean);
}

/** 감사 판정 문장을 사용자가 비교할 수 있는 차별점 문장으로 바꾼다. */
export function normalizeIdeaDifference(value: string) {
  const match = STRUCTURED_DIFFERENCE.exec(value.trim());
  if (!match) return value;
  return `기존 흐름은 그대로, 이번 차이는 ‘${trimSentence(match[1])}’입니다.`;
}

/** 타겟 이름이 설명 첫머리에 다시 반복되는 기계적 문장을 줄인다. */
export function normalizeIdeaTarget(value: string, detail: string) {
  const subject = new RegExp(`^${escapeRegExp(value)}(?:이|가)\\s*`, "u");
  const readableDetail = detail.replace(subject, "");
  return `${value}. ${readableDetail}`;
}

/** 구조화 후보의 공통 순간 문구 대신 실제 사용 순간 자체를 먼저 보여준다. */
export function normalizeIdeaMoment(value: string, detail: string) {
  if (/입력 하나로 결과 하나를 확인하려는 순간입니다\.?$/u.test(detail)) return value;
  return detail;
}

/** 결과 카드의 짧은 서사에 넣을 때 마침표 중복과 감사 문구의 들쭉날쭉한 공백을 없앤다. */
export function normalizeIdeaHeroSentence(value: string) {
  return trimSentence(value).replace(/\s+/g, " ");
}

/**
 * 결과 카드의 첫 세 줄은 제품 지식이 없는 중학생도 읽을 수 있는 말만 남긴다.
 * 정확한 파일 규격과 기술 용어는 상세 결과에 보존하고, 첫 화면에서는 쓰임을 먼저 설명한다.
 */
export function simplifyIdeaHeroLanguage(value: string) {
  return value
    .replace(/`/gu, "")
    .replace(/가입 DB/gu, "가입자 목록")
    .replace(/AI가/gu, "인공지능이")
    .replace(/AI를/gu, "인공지능을")
    .replace(/AI는/gu, "인공지능은")
    .replace(/Search Console/gu, "검색 관리 도구")
    .replace(/ChatGPT/gu, "인공지능")
    .replace(/모바일 대응이 끝난/gu, "휴대폰에서 잘 보이게 만든")
    .replace(/모바일 대응/gu, "휴대폰에서 잘 보이는")
    .replace(/안드로이드 프로젝트/gu, "안드로이드 앱")
    .replace(/권한 있는 60초/gu, "내가 가진 60초")
    .replace(/Google Forms/gu, "구글 설문")
    .replace(/Apps Script/gu, "자동화 코드")
    .replace(/doGet·appendRow/gu, "열기·저장")
    .replace(/구조화 데이터/gu, "검색 정보 코드")
    .replace(/현재 탭/gu, "지금 페이지")
    .replace(
      /검색 정보 코드\(상품 가격·행사 날짜 같은 검색 확장 정보를 만드는 코드\)/gu,
      "검색 정보 코드",
    )
    .replace(
      /웹 프로젝트 압축 파일 파일 하나를 넣으면 모든 출처를 허용하는 외부 접속 허용 설정 패턴을 코드를 실행하지 않고 검사하고/gu,
      "프로젝트 압축 파일 하나를 넣으면 아무 사이트나 접속하게 둔 설정을 찾아",
    )
    .replace(
      /웹 프로젝트 압축 파일 파일 하나를 넣으면 위험한 위험한 코드 실행 계열 호출을 코드를 실행하지 않고 검사하고/gu,
      "프로젝트 압축 파일 하나를 넣으면 위험한 코드 실행 위치를 찾아",
    )
    .replace(
      /웹 프로젝트 압축 파일 파일 하나를 넣으면 하드코딩된 비밀키 패턴을 코드를 실행하지 않고 검사하고/gu,
      "프로젝트 압축 파일 하나를 넣으면 코드에 적힌 비밀키를 찾아",
    )
    .replace(/JSON-LD/giu, "검색 정보 코드")
    .replace(/CSS variables/giu, "화면 꾸밈값")
    .replace(/CSS selector/giu, "화면 요소 위치")
    .replace(/React JSX/giu, "웹 화면 코드")
    .replace(/SRT·VTT/giu, "자막 파일")
    .replace(/Tailwind class/giu, "화면 꾸밈 코드")
    .replace(/debug APK/giu, "안드로이드 설치 파일")
    .replace(/WebView APK/giu, "안드로이드 설치 파일")
    .replace(/session cookie/giu, "로그인 쿠키")
    .replace(/SameSite·Secure/giu, "쿠키 보안")
    .replace(/Google Apps Script/giu, "구글 시트 자동화")
    .replace(/Google Maps/giu, "구글 지도")
    .replace(/Google Doc/giu, "구글 문서")
    .replace(/Apple·Google 캘린더/giu, "휴대폰 달력")
    .replace(/Instagram·TikTok·YouTube/giu, "인스타그램·틱톡·유튜브")
    .replace(/Reddit/gu, "커뮤니티")
    .replace(/PayPal/gu, "결제 서비스")
    .replace(/Figma/gu, "디자인 도구")
    .replace(/GitHub/gu, "개발 저장소")
    .replace(/Android/gu, "안드로이드")
    .replace(/Chrome/gu, "크롬")
    .replace(/JavaScript/gu, "웹 실행 코드")
    .replace(/Tailwind/gu, "화면 꾸밈")
    .replace(/favicon/giu, "사이트 아이콘")
    .replace(/llms\.txt/giu, "인공지능 안내 글")
    .replace(/LCP/gu, "가장 큰 내용이 뜨는 시간")
    .replace(/CLS/gu, "화면이 갑자기 움직이는 정도")
    .replace(/CORS/gu, "외부 접속 허용")
    .replace(/eval/gu, "위험한 코드 실행")
    .replace(/FITS/gu, "천체 사진")
    .replace(/GPX/gu, "자전거 경로 파일")
    .replace(/CRC/gu, "오류 검사값")
    .replace(/XLSX/gu, "엑셀 파일")
    .replace(/SRT|VTT/gu, "자막 파일")
    .replace(/JSX/gu, "웹 화면 코드")
    .replace(/OAuth/gu, "로그인 연결")
    .replace(/Kelvin/gu, "색온도")
    .replace(/DSLR/gu, "카메라")
    .replace(/JLPT/gu, "일본어 시험")
    .replace(/CMS/gu, "홈페이지 관리 도구")
    .replace(/CRM/gu, "고객 목록")
    .replace(/SaaS/gu, "온라인 서비스")
    .replace(/B2B/gu, "기업 고객")
    .replace(/API/gu, "연결 기능")
    .replace(/JSON/gu, "정보 파일")
    .replace(/CSV/gu, "표 파일")
    .replace(/Excel/gu, "엑셀")
    .replace(/HTML/gu, "웹페이지")
    .replace(/CSS/gu, "화면 꾸밈")
    .replace(/URL/gu, "웹 주소")
    .replace(/PDF/gu, "문서 파일")
    .replace(/ZIP/gu, "압축 파일")
    .replace(/APK/gu, "안드로이드 설치 파일")
    .replace(/ICS/giu, "달력 파일")
    .replace(/SVG/gu, "선명한 그림 파일")
    .replace(/JPEG|JPG|PNG/gu, "이미지 파일")
    .replace(/MP4/gu, "영상 파일")
    .replace(/TXT/gu, "글 파일")
    .replace(/CRX/gu, "확장앱 설치 파일")
    .replace(/\bIP\b/gu, "접속 주소")
    .replace(/\bDB\b/gu, "저장 목록")
    .replace(/\b3D\b/gu, "입체")
    .replace(/\b2D\b/gu, "평면")
    .replace(/\bAI\b/gu, "인공지능")
    .replace(/\bclass\b/giu, "꾸밈 코드")
    .replace(/\bselector\b/giu, "화면 요소 위치")
    .replace(/\bbreakpoint\b/giu, "화면 폭 규칙")
    .replace(/\bdiff\b/giu, "변경 파일")
    .replace(/\bdomain\b/giu, "사이트 주소")
    .replace(/\bpath\b/giu, "경로")
    .replace(/메타데이터/gu, "숨은 정보")
    .replace(/타임스탬프/gu, "영상 시각")
    .replace(/플레이트 솔빙/gu, "하늘 위치 찾기")
    .replace(/난독화/gu, "읽기 어렵게 숨긴 코드")
    .replace(/인라인 스타일/gu, "화면 안의 꾸밈 코드")
    .replace(/정적 검사/gu, "코드를 실행하지 않고 검사")
    .replace(/디자인 토큰/gu, "디자인 값")
    .replace(/토큰/gu, "디자인 값")
    .replace(/스키마/gu, "정보 틀")
    .replace(/컴포넌트/gu, "화면 부품")
    .replace(/인터랙티브/gu, "선택형")
    .replace(/플랫폼/gu, "서비스")
    .replace(/유효성 상태/gu, "쓸 수 있는지")
    .replace(/유효성/gu, "쓸 수 있는지")
    .replace(/유효한지/gu, "틀린 곳이 없는지")
    .replace(/유효·무효·확인 필요/gu, "쓸 수 있음·쓸 수 없음·확인 필요")
    .replace(/판정/gu, "판단")
    .replace(/판별/gu, "구분")
    .replace(/검증/gu, "검사")
    .replace(/유형/gu, "종류")
    .replace(/마스킹/gu, "값 가리기")
    .replace(/퍼지 매칭/gu, "비슷한 값 찾기")
    .replace(/파싱/gu, "읽기")
    .replace(/정규화/gu, "같은 형식으로 정리")
    .replace(/플래그/gu, "설정")
    .replace(/로컬에서/gu, "내 기기에서")
    .replace(/로컬 처리/gu, "내 기기 처리")
    .replace(/워크스페이스/gu, "작업 폴더")
    .replace(/오디오/gu, "소리")
    .replace(/브라우저/gu, "인터넷 창")
    .replace(/웹페이지 보고서/gu, "웹 보고서")
    .replace(/스프레드시트/gu, "표")
    .replace(/적요/gu, "거래 내용")
    .replace(/영상 시점/gu, "나온 장면")
    .replace(/체크박스/gu, "확인 칸")
    .replace(/필드/gu, "입력칸")
    .replace(/원화 환산 최종가/gu, "원화로 바꾼 최종 가격")
    .replace(/최종가/gu, "최종 가격")
    .replace(/객실명/gu, "방 이름")
    .replace(/통화를 읽어/gu, "결제 화폐를 읽어")
    .replace(/근거 원문/gu, "근거 문장")
    .replace(/문서 원문/gu, "문서 내용")
    .replace(/호텔 예약 탭/gu, "호텔 예약 창")
    .replace(/탭을/gu, "창을")
    .replace(/반복된 상호/gu, "반복된 결제처")
    .replace(/같은 상호/gu, "같은 결제처")
    .replace(/마스터링/gu, "소리 보정")
    .replace(/화이트밸런스/gu, "사진 색 균형")
    .replace(/리드 목록/gu, "잠재 고객 목록")
    .replace(/리드/gu, "잠재 고객")
    .replace(/Google 자동화 코드/gu, "구글 자동화 코드")
    .replace(/인공지능가/gu, "인공지능이")
    .replace(/안드로이드 프로젝트/gu, "안드로이드 앱")
    .replace(
      /지금 페이지 검사 뒤 검색 정보 코드\(상품 가격·행사 날짜 같은 검색 확장 정보를 만드는 코드\) 오류 블록 하나를 고르면/gu,
      "지금 페이지를 검사해 틀린 검색 정보 코드 하나를 고르면",
    )
    .replace(
      /웹 프로젝트 압축 파일 파일 하나를 넣으면 위험한 위험한 코드 실행 계열 호출을 코드를 실행하지 않고 검사하고/gu,
      "프로젝트 압축 파일 하나를 넣으면 위험한 코드 실행 위치를 찾아",
    )
    .replace(
      /웹 프로젝트 압축 파일 파일 하나를 넣으면 모든 출처를 허용하는 외부 접속 허용 설정 패턴을 코드를 실행하지 않고 검사하고/gu,
      "프로젝트 압축 파일 하나를 넣으면 아무 사이트나 접속하게 둔 설정을 찾아",
    )
    .replace(
      /웹 프로젝트 압축 파일 파일 하나를 넣으면 하드코딩된 비밀키 패턴을 코드를 실행하지 않고 검사하고/gu,
      "프로젝트 압축 파일 하나를 넣으면 코드에 적힌 비밀키를 찾아",
    )
    .replace(/오류 블록/gu, "틀린 부분")
    .replace(/재검사/gu, "다시 확인")
    .replace(/속성/gu, "항목")
    .replace(/패턴/gu, "부분")
    .replace(/파일 파일/gu, "파일")
    .replace(/파일와/gu, "파일과")
    .replace(/파일를/gu, "파일을")
    .replace(/파일가/gu, "파일이")
    .replace(/파일는/gu, "파일은")
    .replace(/인터넷 창와/gu, "인터넷 창과")
    .replace(/인터넷 창를/gu, "인터넷 창을")
    .replace(/인터넷 창가/gu, "인터넷 창이")
    .replace(/종류을/gu, "종류를")
    .replace(/확인 칸가/gu, "확인 칸이")
    .replace(/사용자가 직접 확인할 확인 칸/gu, "직접 고르는 확인 칸")
    .replace(/최종 가격를/gu, "최종 가격을")
    .replace(
      /오타·가짜 이메일과 전화번호가 가입자 목록에 쌓이지 않게 제출 직전에 값을 검사합니다/gu,
      "가입자 목록에 오타와 가짜 연락처가 쌓이지 않도록 하나씩 검사합니다",
    )
    .replace(
      /휴대폰에서 잘 보이게 만든 공개 웹사이트 웹 주소 하나를 넣으면 사이트 아이콘을 앱 아이콘으로 설정하고, 설치 가능한 안드로이드 설치 파일 한 개를 반환합니다\./gu,
      "완성한 모바일 웹 주소 하나를 넣으면 앱 아이콘이 붙은 안드로이드 설치 파일이 나옵니다.",
    )
    .replace(
      /휴대폰에서 잘 보이게 만든 공개 웹사이트 웹 주소 하나를 넣으면 뒤로가기 처리를 적용하고, 설치 가능한 안드로이드 설치 파일 한 개를 반환합니다\./gu,
      "완성한 모바일 웹 주소 하나를 넣으면 뒤로가기가 되는 안드로이드 설치 파일이 나옵니다.",
    )
    .replace(
      /휴대폰에서 잘 보이게 만든 공개 웹사이트 웹 주소 하나를 넣으면 자사 도메인 안에서만 열도록 설정하고, 설치 가능한 안드로이드 설치 파일 한 개를 반환합니다\./gu,
      "완성한 모바일 웹 주소 하나를 넣으면 우리 사이트 안에서만 열리는 안드로이드 설치 파일이 나옵니다.",
    )
    .replace(/웹사이트 웹 주소/gu, "웹 주소")
    .replace(/\s+/gu, " ")
    .trim();
}

/** 원본 감사 데이터의 해라체를 결과 카드의 일관된 존댓말로 맞춘다. */
export function polishIdeaHeroStatement(value: string) {
  return value
    .replace(/해야 한다$/u, "해야 합니다")
    .replace(/필요하다$/u, "필요합니다")
    .replace(/부족하다$/u, "부족합니다")
    .replace(/낯설다$/u, "낯섭니다")
    .replace(/어렵다$/u, "어렵습니다")
    .replace(/없다$/u, "없습니다")
    .replace(/있다$/u, "있습니다")
    .replace(/늦어진다$/u, "늦어집니다")
    .replace(/걸린다$/u, "걸립니다")
    .replace(/반복된다$/u, "반복됩니다")
    .replace(/된다$/u, "됩니다")
    .replace(/맡긴다$/u, "맡깁니다")
    .replace(/옮긴다$/u, "옮깁니다")
    .replace(/맞춘다$/u, "맞춥니다")
    .replace(/만든다$/u, "만듭니다")
    .replace(/보낸다$/u, "보냅니다")
    .replace(/찾아낸다$/u, "찾아냅니다")
    .replace(/손본다$/u, "손봅니다")
    .replace(/지운다$/u, "지웁니다")
    .replace(/딴다$/u, "땁니다")
    .replace(/쓴다$/u, "씁니다")
    .replace(/본다$/u, "봅니다")
    .replace(/든다$/u, "듭니다")
    .replace(/연다$/u, "엽니다")
    .replace(/한다$/u, "합니다");
}

/** 한눈 카드에서는 근거 문장을 의미 단위로 줄이고, 전체 문장은 상세 결과에 남긴다. */
export function compactIdeaHeroSentence(value: string, maxLength: number) {
  const normalized = normalizeIdeaHeroSentence(value);
  const characters = Array.from(normalized);
  if (characters.length <= maxLength) return normalized;

  const draft = characters.slice(0, Math.max(1, maxLength - 1)).join("");
  const lastSpace = draft.lastIndexOf(" ");
  const readableCut = lastSpace >= Math.floor(maxLength * 0.65)
    ? draft.slice(0, lastSpace)
    : draft;
  return `${readableCut.replace(/[,:;·\s]+$/u, "")}…`;
}
