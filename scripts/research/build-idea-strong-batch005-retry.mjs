#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = "docs/research/idea-strong-mechanism-batch-005-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, input), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const keep = new Set([
  "trustmrr:mermaidonline-live",
  "app_store:6760979290",
  "app_store:402405770",
]);

const retryRows = rows.filter((row) => keep.has(row.source_key)).map((row) => {
  const card = structuredClone(row.card_draft);
  if (row.source_key === "trustmrr:mermaidonline-live") {
    card.payers = [
      {
        value: "시스템 설계를 문서로 공유하는 백엔드 개발자",
        detail: "Mermaid 코드를 기술 문서·PR·발표 자료에 넣을 때마다 별도 렌더링 환경을 열어 결과를 확인하고 이미지 파일을 다시 저장한다.",
      },
      {
        value: "설계 변경을 검토하는 개발팀 테크 리드",
        detail: "구조 변경을 리뷰할 때 Mermaid 코드가 문서와 슬라이드에서 어떻게 보이는지 확인하려고 여러 도구를 오가며 렌더링한다.",
      },
      {
        value: "개발팀의 기술 발표를 준비하는 엔지니어링 매니저",
        detail: "PR·기술 문서의 Mermaid 코드를 발표 자료에도 재사용하려고 화면을 캡처하거나 다른 형식으로 반복 저장한다.",
      },
    ];
  }
  if (row.source_key === "app_store:6760979290") {
    card.payers = [
      {
        value: "종이 스케치를 디지털 채색하는 독립 일러스트레이터",
        detail: "손그림을 채색·인쇄·레이어 작업에 쓰기 전에 종이색과 그림자와 연필 얼룩을 매번 수작업으로 지운다.",
      },
      {
        value: "아날로그 콘티를 디지털 원고로 옮기는 웹툰 작가",
        detail: "노트에 그린 선을 채색·인쇄·레이어 작업에 넣으려고 사진을 자르고 대비를 조정한 뒤 선만 다시 딴다.",
      },
      {
        value: "손그림 도안을 인쇄 파일로 만드는 굿즈 제작자",
        detail: "종이에 그린 도안을 디지털 채색·인쇄·레이어 작업에 사용하려고 종이 질감과 번짐을 반복해서 제거한다.",
      },
    ];
    card.moments = [
      {
        value: "손그림 사진을 디지털 채색에 넣기 직전",
        detail: "채색 레이어를 바로 시작하려면 종이 배경과 얼룩이 없는 투명 선화 PNG가 지금 필요하다.",
      },
      {
        value: "손그림 도안을 인쇄 파일로 넘기기 직전",
        detail: "종이 그림자와 얼룩이 인쇄되기 전에 선만 분리된 투명 PNG를 즉시 만들어야 한다.",
      },
      {
        value: "손그림 선을 디지털 레이어로 옮기는 순간",
        detail: "재드로잉 없이 다음 작업을 시작하려면 촬영한 한 장에서 정리된 투명 선화를 바로 얻어야 한다.",
      },
    ];
  }
  if (row.source_key === "app_store:402405770") {
    card.moments = [
      {
        value: "현상약품을 필름에 붓기 직전",
        detail: "첫 단계부터 시간을 잘못 재면 결과를 되돌릴 수 없으므로 온도·교반·푸시 조건이 반영된 시간표가 지금 필요하다.",
      },
      {
        value: "실제 약품 온도를 확인한 직후",
        detail: "기준 온도와 다르면 현상 시간이 바뀌므로 약품을 붓기 전에 모든 단계가 반영된 시간표를 즉시 다시 계산해야 한다.",
      },
      {
        value: "현상 순서와 시간을 종이에 적기 직전",
        detail: "온도·교반·푸시 조건을 빠뜨리지 않고 한 번에 진행하려면 계산된 단계별 시간표가 바로 필요하다.",
      },
    ];
  }
  return { ...row, card_draft: card };
});

if (retryRows.length !== keep.size) throw new Error(`Expected ${keep.size} retry rows, got ${retryRows.length}`);

const output = "docs/research/idea-strong-mechanism-batch-005-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), retryRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: retryRows.length, output }, null, 2));
