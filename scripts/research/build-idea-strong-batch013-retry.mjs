#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-013-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const byKey = new Map(rows.map((row) => [row.source_key, structuredClone(row)]));

const requireSource = (sourceKey) => {
  const row = byKey.get(sourceKey);
  if (!row) throw new Error(`Missing source: ${sourceKey}`);
  return row;
};

const replaceMoments = (sourceKey, moments, reason) => {
  const row = requireSource(sourceKey);
  row.card_draft.moments = moments;
  row.retry_axis = "moments";
  row.retry_reason = reason;
  return row;
};

const replaceTwists = (sourceKey, resultTitles, reason) => {
  const row = requireSource(sourceKey);
  if (resultTitles.length !== row.card_draft.twists.length) {
    throw new Error(`Expected ${row.card_draft.twists.length} result titles: ${sourceKey}`);
  }
  row.card_draft.twists = row.card_draft.twists.map((twist, index) => ({
    ...twist,
    resultTitle: resultTitles[index],
  }));
  row.retry_axis = "twists";
  row.retry_reason = reason;
  return row;
};

const retries = [
  replaceMoments(
    "chrome_web_store:bcnbbkdpnoeaaedhhnlefgpijlpbmije",
    [
      {
        value: "같은 웹앱의 API 동작을 증거로 남길 순간",
        detail: "실패 요청·전체 endpoint·재현용 cURL 중 필요한 형태로 실제 호출 기록을 지금 저장해야 한다.",
      },
      {
        value: "릴리스 전에 호출 구조를 한 번 검수할 순간",
        detail: "웹앱이 실제로 부르는 API의 실패 여부와 중복 endpoint, 전달 가능한 호출 형식을 배포 전에 확인해야 한다.",
      },
      {
        value: "다른 개발팀이 재현할 API 기록을 보낼 순간",
        detail: "받는 팀이 실패 요청이나 endpoint, 민감 헤더를 가린 cURL로 바로 재현할 수 있는 기록이 필요하다.",
      },
    ],
    "Stress 감사에서 특정 payer와 twist가 한 순간에서만 어긋나, 세 payer가 공통으로 겪는 API 기록 순간만 한 번 수정했다.",
  ),
  replaceMoments(
    "chrome_web_store:ffabmkklhbepgcgfonabamgnfafbdlkn",
    [
      {
        value: "필요한 GitHub 폴더만 로컬에서 열기 직전",
        detail: "저장소 전체를 받지 않고 선택한 하위 폴더의 구조·파일 목록·코드만 바로 내려받아 확인해야 한다.",
      },
      {
        value: "저장소 일부를 다른 사람에게 전달하기 직전",
        detail: "선택한 하위 폴더를 구조 보존 ZIP이나 파일 목록 포함 ZIP으로 만들어 바로 전달해야 한다.",
      },
      {
        value: "검토 범위를 파일 목록과 함께 고정할 순간",
        detail: "필요한 GitHub 하위 폴더만 묶고 포함 파일과 불필요한 Git 메타데이터 여부를 명확히 해야 한다.",
      },
    ],
    "Latin 감사에서 역할별 순간 문구가 payer 교차 조합만 막아, 모든 payer가 실제로 겪는 GitHub 하위 폴더 전달 순간으로 한 번 수정했다.",
  ),
  replaceMoments(
    "chrome_web_store:nnffbdeachhbpfapjklmpnmjcgamcdmm",
    [
      {
        value: "공개 페이지에서 쓸 이미지만 한꺼번에 모을 순간",
        detail: "다운로드가 허용된 페이지에서 가로폭·형식·파일 크기 중 한 기준에 맞는 이미지만 ZIP으로 받아야 한다.",
      },
      {
        value: "이미지를 규격 기준으로 다시 골라야 하는 순간",
        detail: "이미 저장한 파일을 하나씩 열지 않고 페이지에서 필요한 크기나 형식의 이미지만 다시 선별해야 한다.",
      },
      {
        value: "선별한 페이지 이미지를 다른 작업으로 넘기기 직전",
        detail: "상품 등록·디자인 보드·CMS 이관에 쓰도록 조건을 통과한 이미지 묶음 하나를 바로 전달해야 한다.",
      },
    ],
    "Latin 감사에서 역할별 순간 문구가 payer 교차 조합만 막아, 모든 payer가 실제로 겪는 공개 페이지 이미지 선별 순간으로 한 번 수정했다.",
  ),
  replaceTwists(
    "chrome_web_store:ndgimibanhlabgdgjcpbbndiehljcpfh",
    [
      "요소 HTML의 검증 locator 3종 파일",
      "깨진 선택자를 대신할 짧은 locator 파일",
      "인수인계용 검증 locator 3종 파일",
    ],
    "Stress 감사에서 세 번째 결과 제목만 불명확해, 원본 locator 생성·검증 메커니즘은 유지하고 세 결과 제목만 한 번 명확하게 고쳤다.",
  ),
  replaceTwists(
    "chrome_web_store:lcgfgelbpgaepigopgkoloicjjkgihcg",
    [
      "웹사이트 디자인 값 CSS 변수 파일",
      "웹사이트 색상·간격 JSON 토큰 파일",
      "웹사이트 디자인 값 Figma 토큰 파일",
    ],
    "Stress 감사에서 세 번째 결과 제목만 불명확해, 원본 디자인 요소 추출 메커니즘은 유지하고 세 결과 제목만 한 번 명확하게 고쳤다.",
  ),
];

const output = "docs/research/idea-strong-mechanism-batch-013-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), retries.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({
  retryCandidates: retries.length,
  output,
  axes: Object.fromEntries(retries.map((row) => [row.name, row.retry_axis])),
}, null, 2));
