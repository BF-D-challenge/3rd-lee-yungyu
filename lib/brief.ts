// 실행 브리프 — 확정 딜리버러블 (가치개선 계획 §3.1, 무료 완제품).
// combos.json 기존 데이터만으로 조립하는 순수 함수 — 네트워크·생성 모델 없음.
import type { Combo } from "./draw";
import { josa } from "./josa";

export interface Brief {
  /** §3.1-1 오늘 만들 한 개 — 골든 타이틀 or 씨앗×불편 */
  title: string;
  oneliner: string | null;
  /** §3.1-2 누구의 어떤 순간 — 숨은 축(상황·심리)을 서술로 승격 */
  who: string;
  /** §3.1-3 만들 것 — 골든 mvp 4개 or format·pain 템플릿 폴백 3개 */
  mvp: string[];
  buildDays: string;
  /** §3.1-4 첫 실험 = 지인 투표 — 검증 도구 자체가 실험 */
  firstExperiment: string;
}

/** target × situation × psych 서술 — lib/josa로 조사 자동 교정 */
const whoOf = (c: Combo): string =>
  `${c.situation}에 ${c.psych ? `${josa(c.psych, "을/를")} 느끼는 ` : ""}${c.target}`;

/** 골든이 아니면 템플릿 폴백 3개 (format.action·pain.short 조합 — 생성 아님) */
const mvpOf = (c: Combo): string[] =>
  c.mvp ?? [
    `"${c.pain.short}" 순간을 ${josa(c.format.action, "으로/로")} 푸는 화면 한 장`,
    c.format.desc,
    "지인에게 바로 보낼 공유 링크 한 개",
  ];

export function buildBrief(combo: Combo): Brief {
  return {
    title: combo.title ?? `${combo.seed.label} × ${combo.pain.short}`,
    oneliner: combo.oneliner,
    who: whoOf(combo),
    mvp: mvpOf(combo),
    buildDays: combo.format.buildDays,
    firstExperiment: "지인 12명에게 3초 투표로 물어보기 — 비용 0원, 오늘 바로",
  };
}

/**
 * §3.1-5 빌드 프롬프트 — Claude Code/v0에 복붙하는 실행 텍스트 (v1 PRD 복원).
 * 이름·한 줄·타깃·문제·MVP·첫 화면·기술 힌트 포함, 마지막 줄은 오늘 완성 지시.
 */
export function buildPrompt(combo: Combo): string {
  const b = buildBrief(combo);
  const oneliner =
    b.oneliner ??
    `${josa(b.who, "을/를")} 위한 ${combo.format.short} — "${combo.pain.short}" 문제를 푼다`;
  const mvpList = b.mvp.map((m, i) => `${i + 1}. ${m}`).join("\n");

  return [
    "아래 제품을 만들어줘.",
    "",
    "## 제품",
    `- 이름: ${b.title}`,
    `- 한 줄: ${oneliner}`,
    `- 타깃: ${b.who}`,
    `- 해결할 문제: ${combo.pain.label}`,
    "",
    "## MVP 기능 (이 목록만, 더 붙이지 말 것)",
    mvpList,
    "",
    "## 첫 화면 구성 제안",
    "- 상단: 제품 이름과 한 줄 소개",
    "- 가운데: 1번 기능이 설명 없이 바로 쓰이게",
    '- 하단: "지인에게 물어보기" 공유 버튼 자리',
    "",
    "## 기술 힌트",
    "- Next.js 정적 페이지, 백엔드 없이 localStorage로 시작",
    "- 모바일 우선, 페이지 하나로 충분",
    "",
    "이걸 오늘 안에 동작하는 데모로 만들어줘.",
  ].join("\n");
}
