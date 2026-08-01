import type {
  TodayApplication,
  TodayArtifacts,
  TodayIdeaResult,
} from "@/lib/today-contract";

const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function splitLine(value: string, limit: number): [string, string] {
  const words = value.trim().split(/\s+/);
  let first = "";
  let second = "";
  for (const word of words) {
    if (!second && `${first} ${word}`.trim().length <= limit) {
      first = `${first} ${word}`.trim();
    } else {
      second = `${second} ${word}`.trim();
    }
  }
  return [first || value, second];
}

export function todayAdSvgDataUrl(job: { id: string; artifacts: TodayArtifacts }): string {
  const [lineOne, lineTwo] = splitLine(job.artifacts.ad.headline, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8f4ed"/>
        <stop offset="1" stop-color="#e5ecff"/>
      </linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#163256" flood-opacity=".16"/>
      </filter>
    </defs>
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <circle cx="920" cy="146" r="210" fill="#ff6b57" opacity=".94"/>
    <circle cx="134" cy="938" r="240" fill="#244bdb" opacity=".94"/>
    <rect x="90" y="110" width="900" height="860" rx="54" fill="#fffdf9" filter="url(#shadow)"/>
    <text x="156" y="205" fill="#244bdb" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="34" font-weight="800" letter-spacing="2">TODAY TEST</text>
    <text x="156" y="386" fill="#141822" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="74" font-weight="900">${escapeXml(lineOne)}</text>
    ${lineTwo ? `<text x="156" y="478" fill="#141822" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="74" font-weight="900">${escapeXml(lineTwo)}</text>` : ""}
    <text x="156" y="602" fill="#555e70" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="36" font-weight="500">${escapeXml(job.artifacts.ad.body.slice(0, 34))}</text>
    <rect x="156" y="735" width="390" height="104" rx="52" fill="#141822"/>
    <text x="351" y="801" text-anchor="middle" fill="#fff" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="34" font-weight="800">${escapeXml(job.artifacts.ad.cta)}</text>
    <text x="156" y="907" fill="#7a8190" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="24">FAKE DOOR · ${escapeXml(job.id.slice(0, 8))}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildTodayArtifacts(
  idea: TodayIdeaResult,
  channel: TodayApplication["channel"],
  signal: TodayApplication["signal"],
) {
  const channelLabels = {
    instagram: "Instagram 피드·스토리",
    community: "고객 커뮤니티",
    direct: "직접 메시지",
  };
  const signalConfig = {
    waitlist: { label: "대기 신청", target: 40, pass: 8 },
    interview: { label: "15분 인터뷰 신청", target: 24, pass: 5 },
    deposit: { label: "환불 가능한 예약금", target: 20, pass: 3 },
  };
  const selected = signalConfig[signal];
  return {
    ad: {
      headline: idea.promise,
      body: `${idea.customer}이 겪는 ${idea.problem}을 더 짧게 해결해요.`,
      cta: selected.label,
      visualLabel: `${idea.mechanism.input}에서 ${idea.mechanism.output}으로 바뀌는 전후 장면`,
    },
    landing: {
      eyebrow: "아직 만들기 전, 먼저 수요를 확인합니다",
      headline: idea.promise,
      body: idea.oneLiner,
      cta: selected.label,
      proof: [
        `대상 · ${idea.customer}`,
        `필요한 순간 · ${idea.problem}`,
        `받는 결과 · ${idea.mechanism.output}`,
      ],
    },
    testPlan: {
      channel: channelLabels[channel],
      signal: selected.label,
      target: selected.target,
      pass: selected.pass,
      rule: `${selected.target}명에게 같은 제안을 보여주고 ${selected.pass}명 이상이 ${selected.label}을 남기면 다음 제작으로 넘어갑니다.`,
    },
  };
}
