import {
  auditResultHeroCopy,
  buildResultHeroCopy,
} from "../src/components/organisms/idea-lab/model";
import { AUTHORED_HERO_COPY } from "../src/components/organisms/idea-lab/authored-hero-copy";
import {
  IDEA_LAB_SCENARIOS,
  KOREA_POPULAR_IDEA_LAB_SCENARIOS,
} from "../src/components/organisms/idea-lab/sample-data";
import { IDEA_PRODUCT_IDENTITIES } from "../src/components/organisms/idea-lab/product-identities";

const lengths = {
  question: [] as number[],
  before: [] as number[],
  after: [] as number[],
  total: [] as number[],
};
const issues: string[] = [];
const coverageIssues: string[] = [];
const hardWords = new Map<string, number>();
const allHeroes: Array<{
  combinationId: string;
  hero: ReturnType<typeof buildResultHeroCopy>;
}> = [];
const hardWordPattern =
  /CRM|DB|API|JSON|CSV|XLSX|HTML|CSS|JSX|URL|PDF|ZIP|APK|ICS|SVG|JPG|JPEG|PNG|GPX|FITS|CRC|SRT|VTT|SQL|SDK|XML|YAML|CORS|OAuth|React|리액트|Kelvin|eval|selector|breakpoint|Tailwind|WordPress|Gutenberg|Mermaid|D\+\d+|메타데이터|유효성|허용 여부|정적 검사|인터랙티브|컴포넌트|스키마|디자인 토큰|타임스탬프|플레이트 솔빙|난독화|인라인 스타일|렌더링|전사 파일/giu;
const uniqueQuestions = new Set<string>();
const uniqueBefore = new Set<string>();
const uniqueAfter = new Set<string>();
const uniqueNames = new Set<string>();
const uniqueTaglines = new Set<string>();
const identityIssues: string[] = [];
const functionalNamePattern =
  /(?:만들기|찾기|검사|변환|정리|계산|받기|저장|제거|분석|측정|추출|바꾸기)$/u;
const auditedScenarios = process.argv.includes("--korea")
  ? KOREA_POPULAR_IDEA_LAB_SCENARIOS
  : IDEA_LAB_SCENARIOS;

for (const scenario of auditedScenarios) {
  const identity = IDEA_PRODUCT_IDENTITIES[scenario.source.id as keyof typeof IDEA_PRODUCT_IDENTITIES];
  if (!identity) {
    identityIssues.push(`${scenario.source.id}: identity missing`);
  } else {
    const nameLength = Array.from(identity.name).length;
    const taglineLength = Array.from(identity.tagline).length;
    if (nameLength < 2 || nameLength > 8) {
      identityIssues.push(`${scenario.source.id}: name length=${nameLength} ${identity.name}`);
    }
    if (functionalNamePattern.test(identity.name)) {
      identityIssues.push(`${scenario.source.id}: functional name ${identity.name}`);
    }
    if (taglineLength < 12 || taglineLength > 28 || /[.!?。]$/u.test(identity.tagline)) {
      identityIssues.push(
        `${scenario.source.id}: tagline length=${taglineLength} ${identity.tagline}`,
      );
    }
    uniqueNames.add(identity.name);
    uniqueTaglines.add(identity.tagline);
  }

  const copy = AUTHORED_HERO_COPY[scenario.source.id];
  if (!copy) {
    coverageIssues.push(`${scenario.source.id}: source copy missing`);
    continue;
  }
  const compareKeys = (label: string, actual: string[], expected: string[]) => {
    const actualSorted = [...actual].sort();
    const expectedSorted = [...expected].sort();
    if (actualSorted.join("\n") !== expectedSorted.join("\n")) {
      coverageIssues.push(
        `${scenario.source.id}:${label} actual=${actualSorted.join(",")} expected=${expectedSorted.join(",")}`,
      );
    }
  };
  compareKeys("hooks", Object.keys(copy.hooks), scenario.moments.map((item) => item.id));
  compareKeys("before", Object.keys(copy.before), scenario.payers.map((item) => item.id));
  compareKeys("after", Object.keys(copy.after), scenario.twists.map((item) => item.id));
}
if (Object.keys(AUTHORED_HERO_COPY).length !== 100) {
  coverageIssues.push(
    `source count=${Object.keys(AUTHORED_HERO_COPY).length}, expected=100`,
  );
}
if (Object.keys(IDEA_PRODUCT_IDENTITIES).length !== 100) {
  identityIssues.push(
    `identity count=${Object.keys(IDEA_PRODUCT_IDENTITIES).length}, expected=100`,
  );
}

let count = 0;
for (const scenario of auditedScenarios) {
  for (const payer of scenario.payers) {
    for (const moment of scenario.moments) {
      for (const twist of scenario.twists) {
        const selection = { source: scenario.source, payer, moment, twist };
        const hero = buildResultHeroCopy(selection);
        const audit = auditResultHeroCopy(selection, hero);
        const combined = [
          hero.name,
          hero.painQuestion,
          hero.before,
          hero.after,
        ].join("\n");
        allHeroes.push({
          combinationId: [
            scenario.source.id,
            payer.id,
            moment.id,
            twist.id,
          ].join(":"),
          hero,
        });

        if (!audit.ok) {
          issues.push(
            `${scenario.id}:${payer.id}:${moment.id}:${twist.id} ${audit.issues.join(" ")}\n${combined}`,
          );
        }
        for (const match of combined.matchAll(hardWordPattern)) {
          const word = match[0];
          hardWords.set(word, (hardWords.get(word) ?? 0) + 1);
        }
        uniqueQuestions.add(hero.painQuestion);
        uniqueBefore.add(hero.before);
        uniqueAfter.add(hero.after);

        lengths.question.push(Array.from(hero.painQuestion).length);
        lengths.before.push(Array.from(hero.before).length);
        lengths.after.push(Array.from(hero.after).length);
        lengths.total.push(
          Array.from(`${hero.painQuestion}${hero.before}${hero.after}`).length,
        );
        count += 1;
      }
    }
  }
}

const percentile = (values: number[], ratio: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
};

console.log(`audited=${count}`);
for (const [label, values] of Object.entries(lengths)) {
  console.log(
    `${label}: p50=${percentile(values, 0.5)} p95=${percentile(values, 0.95)} max=${Math.max(...values)}`,
  );
}
console.log(`hardWords=${JSON.stringify(Object.fromEntries(hardWords))}`);
console.log(
  `unique: questions=${uniqueQuestions.size} before=${uniqueBefore.size} after=${uniqueAfter.size} heroes=${new Set(allHeroes.map((item) => [item.hero.name, item.hero.painQuestion, item.hero.before, item.hero.after].join("\n"))).size}`,
);
console.log(`coverageIssues=${coverageIssues.length}`);
for (const issue of coverageIssues.slice(0, 100)) console.log(issue);
console.log(
  `identities: names=${uniqueNames.size} taglines=${uniqueTaglines.size} issues=${identityIssues.length}`,
);
for (const issue of identityIssues.slice(0, 100)) console.log(issue);
console.log(`issues=${issues.length}`);
for (const issue of issues.slice(0, 100)) console.log(issue);

if (process.argv.includes("--samples")) {
  const samples = [
    { id: "video-place-route", payer: 0, moment: 0, twist: 0 },
    { id: "lookup-brief", payer: 0, moment: 0, twist: 2 },
    { id: "statement-to-table", payer: 0, moment: 0, twist: 0 },
    { id: "video-recipe-card", payer: 0, moment: 0, twist: 0 },
    { id: "document-deadline-card", payer: 0, moment: 0, twist: 0 },
    { id: "recurring-charge-finder", payer: 1, moment: 0, twist: 2 },
    { id: "safe-message-reply", payer: 0, moment: 0, twist: 0 },
    { id: "hotel-final-price-compare", payer: 0, moment: 0, twist: 0 },
    { id: "screen-recording-tutorial", payer: 0, moment: 0, twist: 0 },
    { id: "website-to-android-apk", payer: 0, moment: 0, twist: 0 },
  ];

  for (const [index, sample] of samples.entries()) {
    const scenario = auditedScenarios.find((item) => item.id === sample.id);
    if (!scenario) {
      if (process.argv.includes("--korea")) continue;
      throw new Error(`sample scenario missing: ${sample.id}`);
    }
    const hero = buildResultHeroCopy({
      source: scenario.source,
      payer: scenario.payers[sample.payer],
      moment: scenario.moments[sample.moment],
      twist: scenario.twists[sample.twist],
    });
    console.log(`\n#${index + 1} ${hero.name}`);
    if (hero.tagline) console.log(hero.tagline);
    console.log(hero.painQuestion);
    console.log(hero.before);
    console.log(hero.after);
  }
}

const randomCountArg = process.argv.find((argument) => argument.startsWith("--random="));
if (randomCountArg) {
  const requestedCount = Number.parseInt(randomCountArg.split("=")[1] ?? "", 10);
  const randomCount = Number.isFinite(requestedCount)
    ? Math.min(allHeroes.length, Math.max(1, requestedCount))
    : 10;
  const seedArg = process.argv.find((argument) => argument.startsWith("--seed="));
  const seedText = seedArg?.slice("--seed=".length) || new Date().toISOString();
  let seed = 2166136261;
  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...allHeroes];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  console.log(`\nrandomSeed=${seedText}`);
  for (const [index, sample] of shuffled.slice(0, randomCount).entries()) {
    console.log(`\n#${index + 1} ${sample.hero.name}`);
    console.log(`combinationId=${sample.combinationId}`);
    if (sample.hero.tagline) console.log(sample.hero.tagline);
    console.log(sample.hero.painQuestion);
    console.log(sample.hero.before);
    console.log(sample.hero.after);
  }
}

const expectedSourceCount = auditedScenarios.length;
const expectedAxisCopyCount = expectedSourceCount * 3;
const expectedCombinationCount = expectedSourceCount * 27;

if (
  issues.length > 0
  || coverageIssues.length > 0
  || identityIssues.length > 0
  || hardWords.size > 0
  || uniqueNames.size !== expectedSourceCount
  || uniqueTaglines.size !== expectedSourceCount
  || uniqueQuestions.size !== expectedAxisCopyCount
  || uniqueBefore.size !== expectedAxisCopyCount
  || uniqueAfter.size !== expectedAxisCopyCount
  || count !== expectedCombinationCount
) process.exitCode = 1;
