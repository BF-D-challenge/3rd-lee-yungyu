"use client";

/**
 * /slot — [S1] 빈-슬롯 진입 라우트. 기본은 4칸 전부 빈 시작(자동 스핀 없음).
 * ?seed=&label=&track=&via=vote (수신자 프리필, R9)일 때만:
 * 취향 미설정이면 그 씨앗의 카테고리로 taste 자동 설정 → 씨앗 칸 채움 → 전체 뽑기 1회
 * 자동 실행(10초 룰, `vote_to_spin_landed` 계측 유지). 온보딩(/start) 의존 없음.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlotMachine } from "@/components/organisms/slot/slot-machine";
import type { Seed } from "@/lib/draw";
import { categoryOfSeed, loadTaste, saveTaste } from "@/lib/pools";
import { useSlot } from "@/lib/slot-store";
import { track } from "@/lib/track";

function SlotEntry() {
  const params = useSearchParams();
  const didInit = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const s = useSlot.getState();
    s.hydrateTaste();

    const id = params.get("seed");
    const label = params.get("label");
    const trackParam = params.get("track");
    if (id && label && (trackParam === "like" || trackParam === "know")) {
      const seed: Seed = { id, label, track: trackParam };
      if (params.get("via") === "vote") track("vote_to_spin_landed", { seed_tag: id }); // R9 루프 폐쇄

      // 취향 미설정이면 그 씨앗의 카테고리로 자동 설정 (시트·계측 없이 조용히)
      if (!loadTaste()) {
        const cat = categoryOfSeed(id);
        if (cat && cat.track === trackParam) {
          const taste = { track: cat.track, categoryId: cat.category.id };
          saveTaste(taste);
          useSlot.setState({ taste, tasteResolved: true });
        }
      }
      s.prefillSeed(seed);
      s.spinAll({ keepSeed: true }); // 자동 전체 뽑기 1회 — 10초 룰
    }
    setReady(true);
  }, [params]);

  if (!ready) return null;
  return <SlotMachine />;
}

export default function SlotPage() {
  return (
    <Suspense fallback={null}>
      <SlotEntry />
    </Suspense>
  );
}
