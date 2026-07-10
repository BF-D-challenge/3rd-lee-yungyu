// [v7 롤아웃] golden(사전검수 카드) 콘텐츠는 combos.json에서 분리해 public/data/golden.json으로
// 옮겼다 — 수천 건까지 늘어날 데이터라 정적 import로 client JS 번들에 얹으면 First Load JS가
// 그대로 불어난다. 대신 런타임에 한 번만 fetch해 모듈 캐시에 담아둔다.
// 사용처(draw.ts·pools.ts)는 앱 진입 시 ensureGoldenLoaded()가 끝난 뒤에만 동기 접근한다
// (게이트는 app/page.tsx의 SlotEntry가 SlotMachine을 마운트하기 전에 await로 건다).
import type { Golden } from "./combos";

let cache: Golden[] | null = null;
let loadPromise: Promise<Golden[]> | null = null;

/** 로드 완료 후에만 실제 데이터가 보인다 — 로드 전 호출은 빈 배열(안전한 폴백) */
export function getGoldenSync(): Golden[] {
  return cache ?? [];
}

export function ensureGoldenLoaded(): Promise<Golden[]> {
  if (cache) return Promise.resolve(cache);
  if (!loadPromise) {
    loadPromise = fetch(`/data/golden.json?v=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`golden.json fetch failed: ${res.status}`);
        return res.json() as Promise<Golden[]>;
      })
      .then((data) => {
        cache = data;
        return data;
      })
      .catch((err) => {
        loadPromise = null; // 실패하면 다음 호출에서 재시도
        console.error("[golden-store] load failed", err);
        cache = [];
        return cache;
      });
  }
  return loadPromise;
}
