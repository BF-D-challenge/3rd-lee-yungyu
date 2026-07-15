#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = "docs/research/idea-strong-mechanism-batch-008-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, input), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const keep = new Set([
  "app_store:6461213251",
  "app_store:1140451547",
  "app_store:6762625967",
  "trustmrr:mirage-detect-image-editing",
  "trustmrr:novel-translator",
]);

const commonMoments = {
  "app_store:1140451547": [
    { value: "공 궤적이 잘 보이지 않는 영상을 확인한 순간", detail: "샷 결과를 설명하거나 공유하려면 흐릿한 공 대신 실제 비행 방향이 보이는 완성 영상이 지금 필요하다." },
    { value: "골프 샷 영상을 다른 사람에게 보내기 직전", detail: "받는 사람이 공의 방향을 한눈에 이해하도록 궤적선이 들어간 MP4를 바로 만들어야 한다." },
    { value: "골프 영상 편집을 마치고 게시하기 직전", detail: "다른 편집은 끝났지만 공이 보이지 않아 마지막으로 실제 샷 방향을 따라가는 궤적선이 필요하다." },
  ],
  "app_store:6762625967": [
    { value: "받은 HWP 파일이 휴대폰에서 열리지 않는 순간", detail: "문서 종류와 관계없이 내용을 지금 확인하려면 읽을 수 있는 PDF 한 개가 바로 필요하다." },
    { value: "HWP 문서를 다른 사람에게 전달하기 직전", detail: "상대 기기에서도 본문·표·이미지가 보이도록 범용 PDF로 바꿔야 한다." },
    { value: "HWP 문서 내용을 마감 전에 확인하는 순간", detail: "PC를 다시 찾을 시간 없이 빠진 내용이 없는지 확인할 PDF가 즉시 필요하다." },
  ],
  "trustmrr:mirage-detect-image-editing": [
    { value: "사진을 공개하거나 승인하기 직전", detail: "사람이 모든 픽셀을 확대하기 전에 편집 가능성이 높은 검토 영역을 먼저 좁혀야 한다." },
    { value: "사진 조작 의심을 제기받은 순간", detail: "진위를 단정하지 않고 추가로 확인할 위치가 표시된 히트맵을 바로 공유해야 한다." },
    { value: "사진의 수정 흔적을 빠르게 검수하는 순간", detail: "마감 전에 복제·경계·보정 의심 영역을 한 장에서 확인해야 한다." },
  ],
};

const retryRows = rows.filter((row) => keep.has(row.source_key)).map((row) => {
  const retry = structuredClone(row);
  if (commonMoments[row.source_key]) {
    retry.prior_review_feedback = "첫 Latin-9에서 기능보다 payer마다 지나치게 좁게 쓴 moment가 교차 조합을 깨뜨렸다. payer와 twist는 유지하고 세 moment만 모든 payer에게 공통인 실제 사용 순간으로 바꾼다. 이 한 번 뒤에도 통과하지 못하면 종료한다.";
    retry.card_draft.moments = commonMoments[row.source_key];
  }
  if (row.source_key === "app_store:6461213251") {
    retry.prior_review_feedback = "첫 Stress-3은 2/3였고 유일한 fail은 직접 구매 근거 탐지가 원본의 대가성 문구 탐지에서 벗어난다는 것이었다. payer와 moment는 유지하고 세 번째 twist만 발견한 대가성 문장 목록으로 바꾼다. 이 한 번 뒤에도 3/3가 아니면 종료한다.";
    retry.card_draft.twists[2] = {
      value: "발견된 대가성 문구만 모아 보기",
      detail: "네이버 후기 URL과 대가성 문구 탐지는 유지하고 협찬·원고료·제품 제공 표현이 들어간 원문 문장만 한 장에 모은다.",
      resultTitle: "네이버 후기의 대가성 문구 모음",
      smallestBuild: "네이버 블로그 또는 플레이스 글 URL 하나를 입력받아 대가성 문구를 한 번 탐지하고 발견된 원문 문장 목록 한 개를 보여준다.",
    };
  }
  if (row.source_key === "trustmrr:novel-translator") {
    retry.prior_review_feedback = "첫 Stress-3의 review 두 개는 기능 문제가 아니라 제목에서 영어를 한국어로 번역한다는 핵심 결과가 바로 보이지 않는다는 것이었다. payer·moment·기능은 유지하고 세 resultTitle에 영문 EPUB의 한국어 번역 결과를 명시한다. 이 한 번 뒤에도 3/3가 아니면 종료한다.";
    retry.card_draft.twists[0].resultTitle = "장 구분을 살린 영문 EPUB 한국어 번역";
    retry.card_draft.twists[1].resultTitle = "대화 표기를 살린 영문 EPUB 한국어 번역";
    retry.card_draft.twists[2].resultTitle = "각주 링크를 살린 영문 EPUB 한국어 번역";
  }
  return retry;
});

if (retryRows.length !== keep.size) throw new Error(`Expected ${keep.size} retry rows, got ${retryRows.length}`);

const output = "docs/research/idea-strong-mechanism-batch-008-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), retryRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: retryRows.length, output }, null, 2));
