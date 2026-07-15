#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-010-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const byKey = new Map(rows.map((row) => [row.source_key, structuredClone(row)]));

const replaceMoments = (sourceKey, moments) => {
  const row = byKey.get(sourceKey);
  if (!row) throw new Error(`Missing source: ${sourceKey}`);
  row.card_draft.moments = moments;
  row.retry_axis = "moments";
  row.retry_reason = "Latin 또는 Full 감사에서 payer별 역할이 박힌 순간 문구만 교차 조합을 막아, 모든 payer가 실제로 겪는 공통 순간으로 한 번 수정했다.";
  return row;
};

const retries = [
  replaceMoments("chrome_web_store:jjacifoecglgcnngpjhkckcofiliddei", [
    {
      value: "실제 API 응답을 아직 받을 수 없는 순간",
      detail: "백엔드나 외부 API가 준비되지 않았지만 성공·빈 목록·오류 상태의 화면 연결을 지금 진행해야 한다.",
    },
    {
      value: "세 응답 상태를 릴리스 전에 검수할 순간",
      detail: "성공·빈 목록·오류 JSON 각각에서 화면과 자동화가 멈추지 않는지 같은 설정 형식으로 바로 확인해야 한다.",
    },
    {
      value: "응답 분기를 데모에서 바꿔 보여줄 순간",
      detail: "실제 서버를 건드리지 않고 성공·빈 목록·오류 응답을 즉시 전환해 연결 결과를 설명해야 한다.",
    },
  ]),
  replaceMoments("chrome_web_store:caipeabgogcpmihgldebnaalinnaaeda", [
    {
      value: "공개 풀이 현황을 한 장으로 공유하기 직전",
      detail: "난이도·꾸준함·주제별 기록 중 필요한 근거를 말로 다시 설명하지 않고 한 장으로 전달해야 한다.",
    },
    {
      value: "현재 코딩 테스트 준비 상태를 설명할 순간",
      detail: "공개 프로필의 풀이 분포와 기록을 근거로 지금 강한 부분과 부족한 부분을 구체적으로 설명해야 한다.",
    },
    {
      value: "다음 학습 우선순위를 정하기 직전",
      detail: "난이도 분포·최근 꾸준함·주제별 강약점 중 무엇을 먼저 보완할지 공개 풀이 데이터로 결정해야 한다.",
    },
  ]),
  replaceMoments("chrome_web_store:ijaopicbldggjdgbnfdlkljeggibmcha", [
    {
      value: "노션 페이지를 고정 파일로 전달하기 직전",
      detail: "받는 사람이 노션을 쓰지 않아도 표·이미지·배경이 흐트러지지 않는 PDF 한 개가 지금 필요하다.",
    },
    {
      value: "노션 문서를 인쇄 상태로 검수할 순간",
      detail: "종이나 PDF 화면에서 표 잘림·이미지 비율·다크 배경 대비가 유지되는지 전달 전에 확인해야 한다.",
    },
    {
      value: "노션 원본을 열 수 없는 사람에게 보낼 순간",
      detail: "로그인이나 편집 권한을 요구하지 않고 누구나 같은 배치로 읽는 PDF 파일을 바로 만들어야 한다.",
    },
  ]),
  replaceMoments("chrome_web_store:okeampldbdmpachkggljgpngbooaclal", [
    {
      value: "확정한 장거리 경로를 기기에 넣기 직전",
      detail: "Google Maps에서 만든 경유지와 트랙을 잃지 않은 GPX 파일을 내비게이션 기기에 바로 옮겨야 한다.",
    },
    {
      value: "경로의 구간과 회차점을 함께 공유할 순간",
      detail: "긴 경로를 따라갈 사람이 경유지·구간·회차점을 같은 파일에서 확인하도록 GPX 한 개를 보내야 한다.",
    },
    {
      value: "출발 전에 경로 파일을 최종 확인할 순간",
      detail: "경유지·구간 분리·회차점 이름 중 필요한 정보가 GPX에 남았는지 실제 이동 전에 확인해야 한다.",
    },
  ]),
  replaceMoments("chrome_web_store:nkgaaaiaadfgellaglahphkfjipcgmin", [
    {
      value: "새 Chrome 확장 설치를 승인하기 직전",
      detail: "업무 브라우저에 CRX를 배포하기 전에 권한·외부 전송·난독화 위치 중 위험 근거를 문서로 확인해야 한다.",
    },
    {
      value: "확장 프로그램 보안 근거를 보고할 순간",
      detail: "과도한 권한·외부 도메인·난독화 스크립트 위치를 추측이 아니라 정적 검사 결과로 제출해야 한다.",
    },
    {
      value: "다른 사람에게 설치 여부를 설명할 순간",
      detail: "CRX 파일에서 찾은 구체적인 위치와 근거를 보여 주며 설치 승인 또는 보류 이유를 바로 전달해야 한다.",
    },
  ]),
];

const ipvFooKey = "chrome_web_store:ecanpcehffngcegjmadlcijfolapggal";
const ipvFoo = byKey.get(ipvFooKey);
if (!ipvFoo) throw new Error(`Missing source: ${ipvFooKey}`);
ipvFoo.card_draft.twists[0] = {
  value: "현재 페이지 연결 IP를 보고서 맨 위에 표시",
  detail: "웹페이지 URL에서 실제로 관찰한 현재 문서 연결 IP와 IPv4·IPv6 구분을 정리하는 원본 흐름을 유지하고 첫 연결 IP만 맨 위에 강조한다.",
  resultTitle: "웹페이지 현재 연결 IP 확인 보고서",
  smallestBuild: "공개 웹페이지 URL 하나를 입력하면 페이지 요청 연결을 한 번 검사해 현재 문서 연결 IP와 IP 버전이 표시된 HTML 보고서 한 개를 만든다.",
};
ipvFoo.retry_axis = "twists";
ipvFoo.retry_reason = "Stress 감사가 CDN 뒤 원본 서버 IP 보장을 메커니즘 이탈로 판정해, 실제 관찰 가능한 현재 연결 IP 결과로 한 번 수정했다.";
retries.push(ipvFoo);

const output = "docs/research/idea-strong-mechanism-batch-010-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), retries.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ retryCandidates: retries.length, output, axes: Object.fromEntries(retries.map((row) => [row.name, row.retry_axis])) }, null, 2));
