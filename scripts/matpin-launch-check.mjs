const DEFAULT_PUBLIC_URL = "https://matpin-kr.vercel.app";
const REQUEST_TIMEOUT_MS = 15_000;

const baseUrl = normalizeUrl(process.argv[2] ?? DEFAULT_PUBLIC_URL, "점검 주소");
const publicUrl = normalizeUrl(process.argv[3] ?? DEFAULT_PUBLIC_URL, "공개 주소");

function normalizeUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label}가 올바른 URL이 아닙니다: ${value}`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label}는 HTTP 또는 HTTPS 주소여야 합니다.`);
  }
  return parsed.href.replace(/\/$/, "");
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { response, body: await response.text() };
}

function requireStatus(label, response, expected) {
  if (response.status !== expected) {
    throw new Error(`${label}: HTTP ${response.status}, 예상 ${expected}`);
  }
}

function requireText(label, body, expected) {
  if (!body.includes(expected)) {
    throw new Error(`${label}: 필수 문구를 찾지 못했습니다: ${expected}`);
  }
}

const checks = [
  {
    label: "맛핀 대표 화면",
    run: async () => {
      const { response, body } = await request("/matpin");
      requireStatus("맛핀 대표 화면", response, 200);
      requireText("맛핀 대표 화면", body, "맛집 게시물을 역별로 모아드려요");
      requireText("canonical", body, `<link rel="canonical" href="${publicUrl}/matpin"`);
      requireText("Open Graph URL", body, `<meta property="og:url" content="${publicUrl}/matpin"`);
      requireText(
        "Open Graph 이미지",
        body,
        `<meta property="og:image" content="${publicUrl}/images/matpick/matpin-instagram-share-flow.png"`,
      );
      requireText("Twitter 카드", body, '<meta name="twitter:card" content="summary_large_image"');
    },
  },
  {
    label: "개인정보처리방침",
    run: async () => {
      const { response, body } = await request("/privacy");
      requireStatus("개인정보처리방침", response, 200);
      requireText("개인정보처리방침", body, "2026년 8월 9일");
      requireText("개인정보 문의", body, "@matpin.kr");
    },
  },
  {
    label: "서비스 이용약관",
    run: async () => {
      const { response, body } = await request("/terms");
      requireStatus("서비스 이용약관", response, 200);
      requireText("서비스 이용약관", body, "2026년 8월 9일");
    },
  },
  {
    label: "데이터 삭제 안내",
    run: async () => {
      const { response, body } = await request("/data-deletion");
      requireStatus("데이터 삭제 안내", response, 200);
      requireText("데이터 삭제 안내", body, "모든 맛핀 데이터 삭제");
    },
  },
  {
    label: "공유 이미지",
    run: async () => {
      const { response } = await request("/images/matpick/matpin-instagram-share-flow.png");
      requireStatus("공유 이미지", response, 200);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/png")) {
        throw new Error(`공유 이미지: content-type이 image/png가 아닙니다: ${contentType}`);
      }
    },
  },
  {
    label: "개인 보관함 인증 차단",
    run: async () => {
      const { response } = await request("/api/matpin/saves");
      requireStatus("개인 보관함 인증 차단", response, 404);
    },
  },
  {
    label: "운영 CRM 화면",
    run: async () => {
      const { response, body } = await request("/matpin/admin");
      requireStatus("운영 CRM 화면", response, 200);
      requireText("운영 CRM 화면", body, "맛핀 운영 CRM");
    },
  },
  {
    label: "운영 CRM 미로그인 차단",
    run: async () => {
      const { response, body } = await request("/api/matpin/admin/summary?range=24h");
      requireStatus("운영 CRM 미로그인 차단", response, 401);
      requireText("운영 CRM 미로그인 차단", body, '"error":"unauthenticated"');
      const cacheControl = response.headers.get("cache-control") ?? "";
      if (!cacheControl.includes("private") || !cacheControl.includes("no-store")) {
        throw new Error(`운영 CRM 미로그인 차단: cache-control이 안전하지 않습니다: ${cacheControl}`);
      }
    },
  },
  {
    label: "잘못된 짧은 링크 차단",
    run: async () => {
      const { response } = await request("/s/invalid");
      requireStatus("잘못된 짧은 링크 차단", response, 404);
    },
  },
  {
    label: "작업 처리 API 인증 차단",
    run: async () => {
      const { response } = await request("/api/matpin/jobs/process");
      requireStatus("작업 처리 API 인증 차단", response, 401);
    },
  },
  {
    label: "Webhook 검증 토큰 차단",
    run: async () => {
      const { response } = await request(
        "/api/matpin/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=launch-check",
      );
      requireStatus("Webhook 검증 토큰 차단", response, 403);
    },
  },
  {
    label: "Webhook 서명 차단",
    run: async () => {
      const { response } = await request("/api/matpin/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      requireStatus("Webhook 서명 차단", response, 401);
    },
  },
];

console.log(`맛핀 출시 점검: ${baseUrl}`);
const failures = [];

for (const check of checks) {
  try {
    await check.run();
    console.log(`PASS ${check.label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${check.label}: ${message}`);
    console.error(`FAIL ${check.label}: ${message}`);
  }
}

if (failures.length > 0) {
  console.error(`맛핀 출시 점검 실패: ${failures.length}개`);
  process.exitCode = 1;
} else {
  console.log(`맛핀 출시 점검 통과: ${checks.length}개`);
}
