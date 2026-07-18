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
  return `“${input}”만 넣으면 ${withParticle(result, "이/가")} 바로 나오는 ${platformLabel} 화면 — ${change}`;
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
