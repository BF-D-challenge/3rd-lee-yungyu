#!/usr/bin/env node
// Deterministic bulk generator for v7 golden cards.
// Input: worklist JSON from build-worklist.mjs. Output: Golden-shaped card array.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const worklistPath = process.argv[2];
const outPath = process.argv[3];

if (!worklistPath || !outPath) {
  console.error("usage: node scripts/rollout/generate-v7-cards.mjs <worklist.json> <out-cards.json>");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const combos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const chunks = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), worklistPath), "utf8"));

const formatIndex = new Map(combos.formats.map((f, i) => [f.id, i]));
const painById = new Map(combos.pains.map((p) => [p.id, p]));

const legacyLabels = {
  "escape-room": "방탈출",
  "dividend-etf": "배당ETF",
  "plant-care": "반려식물",
  knitting: "뜨개질",
  "freelance-tax": "프리랜서 세금",
  "cafe-ops": "카페운영",
  "ux-ui": "화면디자인",
  "real-estate-agent": "부동산중개",
  tutoring: "과외",
  "nursing-handoff": "간호 인수인계",
  "insurance-review": "보험 보장분석",
  "import-duty": "수입 관세",
};

const formatCopy = {
  "share-link": {
    suffix: "링크",
    title: "공유 링크",
    noun: "공유링크",
    mvp: ["내용 입력해 카드 만들기", "주소에 담아 공유", "받는 사람 화면 보기", "내 브라우저에 저장"],
    today: "내용을 카드로 만들고 링크로 보내는",
  },
  "vote-card": {
    suffix: "픽",
    title: "투표 카드",
    noun: "투표카드",
    mvp: ["후보 3개 입력", "익명 투표 버튼", "한마디 반응 받기", "결과 링크 공유"],
    today: "후보를 올리고 투표를 받는",
  },
  chatbot: {
    suffix: "톡",
    title: "상담 챗봇",
    noun: "챗봇",
    mvp: ["질문 입력창 만들기", "답변 규칙 5개 작성", "대화 기록 저장", "결과 다시 보기"],
    today: "질문에 규칙대로 답하는",
  },
  dashboard: {
    suffix: "판",
    title: "요약판",
    noun: "요약판",
    mvp: ["자료 입력해 표 만들기", "개수·상태 자동 집계", "위험 항목 빨간 표시", "요약 링크 공유"],
    today: "입력한 항목을 표와 숫자로 보는",
  },
  "chrome-ext": {
    suffix: "컷",
    title: "확장 도구",
    noun: "확장도구",
    mvp: ["현재 화면 정보 읽기", "필요한 항목만 표시", "한 번에 복사하기", "설정 브라우저 저장"],
    today: "브라우저 화면 옆에서 바로 돕는",
  },
  "landing-waitlist": {
    suffix: "대기",
    title: "예약 페이지",
    noun: "예약페이지",
    mvp: ["문제 한 줄 소개", "관심 등록 입력칸", "예상 기능 3개 표시", "등록 명단 내려받기"],
    today: "문제를 설명하고 관심 등록을 받는",
  },
  "crud-app": {
    suffix: "함",
    title: "관리 화면",
    noun: "관리표",
    mvp: ["항목 추가 화면", "목록 검색·정렬", "수정·삭제 버튼", "공유 링크 만들기"],
    today: "항목을 추가하고 고치는",
  },
  "digest-bot": {
    suffix: "알림",
    title: "요약 알림",
    noun: "알림봇",
    mvp: ["자료 주소 입력", "새 글 자동 모으기", "요약 문장 만들기", "알림 받을 시간 설정"],
    today: "새 내용을 모아 요약해주는",
  },
  "calc-tool": {
    suffix: "진단",
    title: "진단 계산기",
    noun: "진단기",
    mvp: ["질문 4개 선택", "점수 규칙 만들기", "결과 카드 표시", "결과 링크 공유"],
    today: "질문 답변으로 결과를 계산하는",
  },
  curation: {
    suffix: "모음",
    title: "추천 목록",
    noun: "추천목록",
    mvp: ["후보 항목 추가", "태그로 필터하기", "인기순 정렬", "목록 링크 공유"],
    today: "후보를 모아 필터로 고르는",
  },
  "template-gen": {
    suffix: "틀",
    title: "생성 템플릿",
    noun: "생성틀",
    mvp: ["값 입력칸 만들기", "문장 틀 3개 준비", "결과 복사 버튼", "링크로 다시 열기"],
    today: "입력값을 문장과 화면으로 바꾸는",
  },
  "streak-tracker": {
    suffix: "기록",
    title: "연속 기록",
    noun: "연속기록표",
    mvp: ["오늘 했음 버튼", "며칠 연속 표시", "쉰 날도 따로 표시", "기록 링크 공유"],
    today: "오늘 했는지 누르고 며칠째인지 보는",
  },
};

function normalizeLabel(value) {
  return String(value || "")
    .replace(/UX\/UI/g, "화면디자인")
    .replace(/DevOps\/인프라/g, "운영인프라")
    .replace(/QA\/테스트/g, "테스트")
    .replace(/CRM\/이메일/g, "고객메일")
    .replace(/SaaS\/업무툴/g, "업무툴")
    .replace(/IoT\/하드웨어/g, "하드웨어")
    .replace(/넷플릭스\/OTT/g, "영상구독")
    .replace(/홈트\/맨몸/g, "홈트")
    .replace(/베이킹\/디저트/g, "디저트")
    .replace(/덕질\/굿즈/g, "덕질굿즈")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactLabel(value) {
  return normalizeLabel(value)
    .replace(/[·/]/g, "")
    .replace(/\s+/g, "")
    .replace(/앱$/g, "")
    .replace(/선정$/g, "")
    .replace(/관리$/g, "")
    .replace(/기획$/g, "")
    .replace(/제작$/g, "")
    .replace(/추적$/g, "")
    .replace(/정리$/g, "")
    .replace(/비교$/g, "")
    .replace(/검토$/g, "")
    .replace(/연습$/g, "")
    .replace(/요약$/g, "")
    .replace(/작성$/g, "")
    .replace(/응대$/g, "")
    .replace(/생성$/g, "")
    .replace(/체크$/g, "")
    .trim();
}

function take(value, max) {
  const text = String(value || "");
  return text.length > max ? text.slice(0, max) : text;
}

function hashText(value) {
  let hash = 0;
  for (const ch of String(value)) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return hash;
}

function hasKoreanFinalConsonant(value) {
  const text = String(value || "");
  const ch = text[text.length - 1];
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  const jong = (code - 0xac00) % 28;
  return jong !== 0 && jong !== 8;
}

function ro(value) {
  return `${value}${hasKoreanFinalConsonant(value) ? "으로" : "로"}`;
}

function amountManwon(anchor) {
  const usd = Number(anchor?.r || anchor?.rev || 500);
  return Math.max(10, Math.round((usd * 1350) / 10000)).toLocaleString("ko-KR");
}

function findSeedLabel(item) {
  if (legacyLabels[item.seed]) return legacyLabels[item.seed];
  if (item.seedLabel && item.seedLabel !== item.seed) return item.seedLabel;
  for (const track of ["like", "know"]) {
    for (const category of combos.tracks[track].categories) {
      const seed = category.seeds.find((s) => s.id === item.seed);
      if (seed) return seed.label;
    }
  }
  const preset = combos.presetSeeds.find((s) => s.id === item.seed);
  return preset?.label || item.seed;
}

function brandBase(seedLabel) {
  const base = compactLabel(seedLabel)
    .replace(/^AI/g, "인공지능")
    .replace(/AI/g, "")
    .replace(/SEO/g, "검색")
    .replace(/ATS/g, "서류")
    .replace(/ETF/g, "펀드");
  return take(base || "오늘", 5);
}

function uniqueTitle(item, seedLabel, painShort, fmt, seen) {
  const base = brandBase(seedLabel);
  const painWord = take(compactLabel(painShort), 2) || item.pain;
  const seedHash = (hashText(item.seed) % 90) + 10;
  let appName = `${base}${painWord}${fmt.suffix}`;
  if (appName.length > 12) appName = `${take(base, 5)}${fmt.suffix}`;
  let keyword = take(base, 6);
  let title = `${appName} — ${keyword} ${fmt.title}`;
  if (title.length > 26) title = `${appName} — ${take(keyword, 4)} ${fmt.title}`;
  if (title.length > 26) title = `${appName} — ${fmt.title}`;
  if (title.length > 26) {
    appName = `${take(base, 3)}${fmt.suffix}`;
    title = `${appName} — ${fmt.title}`;
  }
  let finalTitle = title;
  let n = 2;
  while (seen.has(finalTitle)) {
    const altApp = `${take(appName, Math.max(1, 10 - String(seedHash).length - String(n).length))}${seedHash}${n}`;
    finalTitle = `${altApp} — ${fmt.title}`;
    if (finalTitle.length > 26) finalTitle = `${take(altApp, 8)} — ${take(fmt.title, 6)}`;
    n++;
  }
  seen.add(finalTitle);
  return { title: finalTitle, appName: finalTitle.split(" — ")[0] };
}

function makeOneliner(item, seedLabel, painShort, fmt, seen) {
  const n = 10 + ((hashText(item.seed) + item.pain * 7 + (formatIndex.get(item.format) || 0) * 11) % 80);
  const time = ["월요일 밤 11시", "출근 10분 전", "마감 30분 전", "일요일 밤", "점심 직후"][
    (item.pain + (formatIndex.get(item.format) || 0)) % 5
  ];
  const seed = take(normalizeLabel(seedLabel), 10);
  const pain = take(normalizeLabel(painShort), 12);
  const candidates = [
    `${time}, ${seed} ${n}개 뒤지다 ${pain}에 식은땀, ${ro(fmt.noun)} 바로 정리돼 안심`,
    `${seed} ${n}개 헷갈린 밤, ${pain} 막막함이 ${ro(fmt.noun)} 풀려 안심`,
    `${seed} ${n}개 밤샘, ${pain} 막막함을 ${ro(fmt.noun)} 풀어 안심`,
  ];
  let line = candidates.find((candidate) => candidate.length <= 70) || candidates.at(-1).slice(0, 70);
  let count = 2;
  while (seen.has(line)) {
    const suffix = `${count}번째 안심`;
    line = `${take(line, 70 - suffix.length - 1)} ${suffix}`;
    count++;
  }
  seen.add(line);
  return line;
}

function makeTarget(item, seedLabel, painShort) {
  const role = item.track === "know" ? "실무자" : "사람";
  const seed = take(normalizeLabel(seedLabel), 12);
  const pain = take(normalizeLabel(painShort), 14);
  const target = `${seed} 하다가 ${pain}에 막히는 ${role}`;
  return target.length <= 50 ? target : `${take(seed, 10)} 때문에 결정 못 하는 ${role}`;
}

function makeBuildPrompt(seedLabel, painShort, fmtId) {
  const seed = normalizeLabel(seedLabel);
  const pain = normalizeLabel(painShort);
  const prompts = {
    "share-link": `${seed} 내용을 제목, 설명, 메모로 입력하면 결과 카드가 만들어지는 웹페이지를 만들어줘. 저장은 브라우저 저장공간에 하고, 공유 버튼을 누르면 카드 내용이 주소 뒤에 담겨 다른 사람도 같은 화면을 볼 수 있게 해줘. ${pain}을 줄이기 위해 받은 사람 화면은 읽기 전용으로 보여줘.`,
    "vote-card": `${seed} 후보 3개를 제목과 한 줄 설명으로 입력하는 화면을 만들어줘. 공유 링크를 받은 사람이 로그인 없이 하나를 고르고 한마디를 남길 수 있게 하고, 만든 사람은 같은 링크에서 투표 수와 한마디를 볼 수 있게 해줘. 데이터는 우선 브라우저에 저장해줘.`,
    chatbot: `${seed} 상황을 한 줄로 입력하면 미리 정한 답변 규칙 5개 중 맞는 답을 골라 보여주는 대화 화면을 만들어줘. 답변에는 왜 그렇게 보는지와 다음 행동 1개를 붙여줘. 대화 기록은 브라우저에 저장하고 다시 들어오면 이어서 볼 수 있게 해줘.`,
    dashboard: `${seed} 항목을 이름, 상태, 메모로 입력하는 표 화면을 만들어줘. 상태별 개수와 위험 항목 수를 위쪽 요약판에 보여주고, ${pain}과 관련된 항목은 빨간 딱지로 표시해줘. 표는 검색과 정렬이 가능하고 링크로 공유할 수 있게 해줘.`,
    "chrome-ext": `${seed} 일을 할 때 현재 화면의 제목과 선택한 문장을 읽어 옆 패널에 정리해주는 브라우저 확장 도구 화면을 만들어줘. 필요한 항목만 복사하는 버튼과 자주 쓰는 설정 저장 기능을 넣고, ${pain}을 줄이는 체크 목록도 함께 보여줘.`,
    "landing-waitlist": `${seed} 문제를 한 줄로 소개하고 관심 있는 사람이 이메일이나 연락처를 남기는 예약 페이지를 만들어줘. 화면에는 문제 상황, 해결 약속, 예상 기능 3개를 짧게 보여주고, 등록된 명단은 브라우저에 저장했다가 내려받을 수 있게 해줘.`,
    "crud-app": `${seed} 항목을 추가, 수정, 삭제할 수 있는 목록 관리 웹앱을 만들어줘. 각 항목에는 제목, 상태, 메모를 넣고 목록에서 검색과 정렬을 할 수 있게 해줘. 데이터는 브라우저에 저장하고 공유 버튼을 누르면 현재 목록을 링크에 담아 다시 열 수 있게 해줘.`,
    "digest-bot": `${seed} 관련 주소나 메모를 여러 개 입력하면 새 내용처럼 보이는 항목을 모아 짧게 요약해주는 화면을 만들어줘. 요약에는 중요한 문장 3개와 다음 확인 시간 1개를 보여주고, 알림 받을 시간 설정과 브라우저 저장 기능을 넣어줘.`,
    "calc-tool": `${seed} 상황을 묻는 객관식 질문 4개와 점수 규칙을 만들어줘. 답을 고르면 ${pain} 위험도를 낮음, 보통, 높음으로 계산해 결과 카드에 보여주고, 왜 그런 결과인지 한 줄 이유와 오늘 할 일 1개를 붙여줘. 결과는 링크로 공유되게 해줘.`,
    curation: `${seed} 후보를 이름, 링크, 태그, 메모로 추가하는 목록 화면을 만들어줘. 태그별 필터와 인기순, 최신순 정렬을 넣고, ${pain}을 줄이도록 추천 이유를 한 줄씩 적을 수 있게 해줘. 목록은 브라우저에 저장하고 링크로 공유할 수 있게 해줘.`,
    "template-gen": `${seed}에 필요한 값 몇 개를 입력하면 바로 복사할 수 있는 문장이나 문서 틀이 나오는 생성 화면을 만들어줘. 입력값은 브라우저에 저장하고, 결과에는 제목, 본문, 확인할 점 3개를 보여줘. 같은 값을 주소에 담아 다시 열 수 있게 해줘.`,
    "streak-tracker": `${seed}를 오늘 했는지 누르는 기록 화면을 만들어줘. 날짜별로 했음, 쉼, 메모를 저장하고 며칠 연속인지 큰 숫자로 보여줘. 하루 쉬어도 기록이 사라지지 않게 따로 표시하고, 기록을 링크로 공유할 수 있게 해줘.`,
  };
  return prompts[fmtId];
}

function makeTodayAction(seedLabel, fmt) {
  const seed = take(normalizeLabel(seedLabel), 14);
  return `오늘 반나절 동안 ${seed} 항목을 넣고 ${fmt.today} 화면까지 만들 수 있어요.`;
}

function makeTimeline(seedLabel, painShort, fmt, item) {
  const seed = take(normalizeLabel(seedLabel), 12);
  const pain = take(normalizeLabel(painShort), 14);
  const n = 10 + ((hashText(item.seed) + item.pain * 5 + (formatIndex.get(item.format) || 0) * 13) % 70);
  return [
    {
      t: "평소 저녁",
      act: `${seed} 자료를 일단 저장함`,
      emo: "나중에 보면 되겠지 안심",
      pain: false,
    },
    {
      t: "마감 30분 전",
      act: `${seed} ${n}개를 다시 뒤짐`,
      emo: `${pain} 때문에 식은땀`,
      pain: true,
    },
    {
      t: "결정 직전",
      act: `${fmt.noun} 없이 또 손으로 정리`,
      emo: "헛수고 같아 지치고 민망함",
      pain: true,
    },
  ];
}

function makeAnchor(anchor) {
  const name = String(anchor?.n || anchor?.name || "").trim() || "TrustMRR 앱";
  const desc = String(anchor?.d || anchor?.desc || "좁은 반복 문제를 해결하는 앱").replace(/\$/g, "").trim();
  return { name, desc: take(desc, 110), amount: amountManwon(anchor), hasRevenue: Number(anchor?.r || anchor?.rev || 0) > 0 };
}

const titleSeen = new Set();
const onelinerSeen = new Set();
const cards = [];

for (const chunk of chunks) {
  const anchors = Array.isArray(chunk.anchors) && chunk.anchors.length ? chunk.anchors : [{ n: "TrustMRR 앱", d: "좁은 반복 문제를 해결하는 앱", r: 500 }];
  for (let i = 0; i < chunk.items.length; i++) {
    const item = chunk.items[i];
    const seedLabel = findSeedLabel(item);
    const pain = painById.get(item.pain) || { short: item.painShort || "결정 어려움" };
    const painShort = item.painShort || pain.short;
    const fmt = formatCopy[item.format];
    if (!fmt) throw new Error(`unsupported format: ${item.format}`);
    const anchor = makeAnchor(anchors[(hashText(item.seed) + item.pain + (formatIndex.get(item.format) || 0) + i) % anchors.length]);
    const { title, appName } = uniqueTitle(item, seedLabel, painShort, fmt, titleSeen);
    const target = makeTarget(item, seedLabel, painShort);

    cards.push({
      seed: item.seed,
      pain: item.pain,
      format: item.format,
      title,
      oneliner: makeOneliner(item, seedLabel, painShort, fmt, onelinerSeen),
      target,
      mvp: fmt.mvp,
      evidence: `${normalizeLabel(seedLabel)} 문제를 푸는 비슷한 해외 앱이 매달 약 ${anchor.amount}만원씩 벌어요`,
      todayAction: makeTodayAction(seedLabel, fmt),
      buildPrompt: makeBuildPrompt(seedLabel, painShort, item.format),
      evidenceType: anchor.hasRevenue ? "revenue" : "usage",
      anchorName: anchor.name,
      anchorDetail: `월매출 약 ${anchor.amount}만원 — ${anchor.desc}`,
      appName,
      frontStory: {
        persona: target,
        timeline: makeTimeline(seedLabel, painShort, fmt, item),
      },
    });
  }
}

fs.mkdirSync(path.dirname(path.resolve(process.cwd(), outPath)), { recursive: true });
fs.writeFileSync(path.resolve(process.cwd(), outPath), JSON.stringify(cards, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, cards: cards.length, outPath: path.resolve(process.cwd(), outPath) }, null, 2));
