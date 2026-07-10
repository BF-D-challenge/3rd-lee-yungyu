#!/usr/bin/env node
// Read-only visible-surface smell check for Golden cards.
//
// This ignores internal ids, but includes frontStory because the result panel
// renders it as the visible "이런 흐름을 겪어요" section.

import fs from "node:fs";

const cardsPath = process.argv[2] ?? "public/data/golden.json";
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

const badPattern =
  /축구|전술|football|스트릭|선택 마비|가짜 가입 못 걸러|CORS 에러 못 읽음|복붙|아무데나|커피당번 답 대충옴|하루 어기면 다 포기|얼굴 합성|매수판단|주가예측|자동매매|투자 토론|매수·관망|위험체크|경매 입문|경매질문|계약검토|수정 요청할 조항|첫 수량 추천|매수 판단|후기처럼 보이는 채팅|스팸함 직행|재발송 순서|상품등록 노가다|AI가 노드 헛짓|첫방 카드|주의열|처음 딥워크|첫 슬롯|가게랜딩|Notion tool|출처을|주제을|메시지을|문구을|공고을|자세을|서비스을|오류을|소재을|컴포넌트을|리드을|후보을|근거을|키워드을|경비을|신호을|신호 신호|투표카드으로|공유링크으로|문안틀으로|진단툴으로|진단기으로|대시보드으로|관리표으로|크루장가|취준생가|지원자관리.*발주|후보 후보|결과 카드 저장 결과|샘플 5개|DevSuite|AppGrowKit|월매출 약 68만원|매달 약 68만원|반복 해결이에요|오늘 처리하려고 열어봄|기준이 없어 손이 멈춤|다시 사람 기억에 기대려 함|공유 직전에 다시 확인하느라 지침|피드백 받기 전에 지침|단계을|성공배|초안사람결|대시보 —|앞 위로 톤|위로 톤과|두개|세개|네개|후보 링크 저장 화면|태그 붙이기 버튼|묶음 링크 공유|후보 묶음 데모|관리판 데모|반응 버튼 열기|띄우기 확인|결과 이미지 저장|후보 카드 만들기부터 결과 이미지 저장|도메인 규칙 저장 결과/i;

const visibleText = (card) =>
  [
    card.appName,
    card.title,
    card.oneliner,
    card.target,
    ...(card.mvp ?? []),
    card.evidence,
    card.todayAction,
    card.buildPrompt,
    card.whyItMatters,
    card.frontStory?.persona,
    ...(card.frontStory?.timeline ?? []).flatMap((step) => [step.t, step.act, step.emo]),
  ].filter(Boolean).join(" ");

const bad = cards.flatMap((card) => {
  const text = visibleText(card);
  const match = text.match(badPattern);
  return match
    ? [{
        key: `${card.seed}|${card.pain}|${card.format}`,
        appName: card.appName,
        title: card.title,
        hit: match[0],
      }]
    : [];
});

const denseNames = cards.filter((card) => card.appName && !/\s/.test(card.appName) && /[가-힣]{9,}/.test(card.appName));
const duplicateTitles = cards.length - new Set(cards.map((card) => card.title)).size;
const megaAnchors = cards.filter((card) => maxEokAmount(visibleText(card)) >= 50);

const result = {
  ok: bad.length === 0 && denseNames.length === 0 && duplicateTitles === 0 && megaAnchors.length === 0,
  total: cards.length,
  badCount: bad.length,
  denseAppNames: denseNames.length,
  duplicateTitles,
  megaAnchors: megaAnchors.length,
  bad: bad.slice(0, 40),
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);

function maxEokAmount(text) {
  let max = 0;
  for (const match of String(text ?? "").matchAll(/약\s*([\d,]+)\s*억원/g)) {
    const eok = Number(match[1].replaceAll(",", ""));
    if (Number.isFinite(eok)) max = Math.max(max, eok);
  }
  return max;
}
