#!/usr/bin/env node
// Hand-polish awkward digest-bot oneliners created during residual QA cleanup.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const backupDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");

const fixes = new Map([
  ["sales-quote-response-followup|57|digest-bot", "견적 담당자가 같은 질문을 또 복붙할 때, 새로 답해야 할 반복 질문만 보내는 알림봇"],
  ["crypto-web3-airdrop-alert-tracker|76|digest-bot", "코인 커뮤니티 운영자가 추천 캡처를 놓칠 때, 다시 볼 추천만 모아주는 알림봇"],
  ["backend|32|digest-bot", "백엔드 개발자가 신청 목록의 가짜 연락처를 의심할 때, 확인할 신청만 보내는 알림봇"],
  ["marketplace-early-user-trial|32|digest-bot", "체험단 운영자가 가짜 연락처를 의심할 때, 먼저 볼 신청만 골라주는 알림봇"],
  ["marketplace-local-errand-matching|32|digest-bot", "동네 심부름 운영자가 가짜 신청을 걸러야 할 때, 확인할 신청만 보내는 알림봇"],
  ["no-code-widget-inbox|32|digest-bot", "웹문의함 담당자가 가짜 연락처를 의심할 때, 먼저 확인할 문의만 보내는 알림봇"],
  ["recruiting-hr-hidden-job-postings|32|digest-bot", "취업 정보 운영자가 가짜 신청을 의심할 때, 확인할 지원만 추려주는 알림봇"],
  ["sns-ops|66|digest-bot", "SNS 운영자가 팔로워 변화 이유를 놓칠 때, 먼저 볼 이탈 신호만 보내는 알림봇"],
  ["utilities-mention-tracker|66|digest-bot", "작은 브랜드 운영자가 언급 변화를 놓칠 때, 확인할 이탈 신호만 보내는 알림봇"],
  ["devops|38|digest-bot", "인프라 담당자가 비용 증가 원인을 모를 때, 먼저 볼 요금 위험만 보내는 알림봇"],
  ["security-cert-expiry|38|digest-bot", "운영 담당자가 비용 증가 원인을 모를 때, 놓치면 안 될 요금 위험만 보내는 알림봇"],
  ["backend|33|digest-bot", "백엔드 개발자가 브라우저 오류를 못 읽을 때, 원인 후보만 추려주는 알림봇"],
  ["utilities-mention-tracker|35|digest-bot", "작은 브랜드 운영자가 언급 출처를 놓칠 때, 출처 후보만 모아주는 알림봇"],
  ["crm-email|69|digest-bot", "이메일 마케터가 박람회 리드 메일을 보낼 때, 스팸 위험만 먼저 알려주는 알림봇"],
  ["marketplace-local-errand-matching|60|digest-bot", "동네 심부름 운영자가 입금자를 맞춰야 할 때, 확인할 입금만 보내는 알림봇"],
  ["performance-marketing|60|digest-bot", "마케팅 담당자가 입금자명을 맞춰야 할 때, 확인할 입금만 추려주는 알림봇"],
  ["recruiting-hr-candidate-outreach|69|digest-bot", "채용 소싱 담당자가 리드 메일을 보낼 때, 스팸 위험만 먼저 알려주는 알림봇"],
  ["sales-cold-email-outreach|69|digest-bot", "콜드메일 담당자가 박람회 리드에게 보낼 때, 스팸 위험만 먼저 알려주는 알림봇"],
  ["logistics-delivery|55|digest-bot", "배송 운영자가 채널별 요청 상태를 놓칠 때, 확인할 혼선만 보내는 알림봇"],
  ["recruiting-hr-applicant-pipeline|55|digest-bot", "채용 담당자가 지원자 상태를 놓칠 때, 확인할 혼선만 추려주는 알림봇"],
  ["utilities-video-subtitle-extract|78|digest-bot", "영상 요약러가 재료 구간을 되감을 때, 다시 볼 구간만 보내는 알림봇"],
]);

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const before = JSON.stringify(cards, null, 2);
const changed = [];

for (const card of cards) {
  const k = key(card);
  if (!fixes.has(k)) continue;
  card.oneliner = fixes.get(k);
  changed.push({ key: k, title: card.title, oneliner: card.oneliner });
}

const backupPath = path.join(backupDir, `golden-before-digest-oneliner-polish-${Date.now()}.json`);
fs.writeFileSync(backupPath, before + "\n");
fs.writeFileSync(goldenPath, JSON.stringify(cards, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  changed: changed.length,
  total: cards.length,
  backupPath: path.relative(repoRoot, backupPath),
  samples: changed.slice(0, 8),
}, null, 2));
