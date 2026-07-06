"use client";

/**
 * [S1] 빈-슬롯 오케스트레이터 — 필수 4칸(🌱씨앗·😖불편·📦형태·🎬장면) + 옵션 💭마음.
 * 진입 시 전부 빈 칸, 하단 부채꼴 덱에서 한 장씩 채운다 (정적 데모 v7 모델).
 * 채워진 카드 탭 = 그 축만 교체 · ✕ = 비움 · 🎲 전체 다시 뽑기만 스핀 캡 소모.
 */

import { useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/atoms/button";
import { Pill } from "@/components/atoms/pill";
import { GlassCard } from "@/components/atoms/glass-card";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import {
  buildDeck,
  drawFormat,
  drawPain,
  drawPsych,
  drawSeed,
  drawSituation,
  type AxisId,
  type AxisValue,
} from "@/lib/pools";
import { SPIN_CAP, filledRequired, REQUIRED, useSlot } from "@/lib/slot-store";
import { fakeDoor, track, type FakeDoorProduct } from "@/lib/track";
import { cn } from "@/lib/utils";
import { assembleCombo, assembleLine } from "./assemble";
import { ConfirmBranch } from "./confirm-branch";
import { FanDeck } from "./fan-deck";
import { GoldSentence } from "./gold-sentence";
import { PaywallSheet } from "./paywall-sheet";
import { SlotCell, type CellContent } from "./slot-cell";
import { TasteSheet } from "./taste-sheet";

const AXES: { id: AxisId; label: string; emoji: string; optional?: boolean }[] = [
  { id: "seed", label: "씨앗", emoji: "🌱" },
  { id: "pain", label: "불편", emoji: "😖" },
  { id: "format", label: "형태", emoji: "📦" },
  { id: "situation", label: "장면", emoji: "🎬" },
  { id: "psych", label: "마음", emoji: "💭", optional: true },
];

export function SlotMachine() {
  const {
    slots, locked, psychOpen, spins, capHit, taste, tasteSheetOpen,
    place, swap, removeAxis, toggleLock, openPsych, spinAll,
    setTaste, skipTaste, openTasteSheet,
  } = useSlot();

  const [hotAxis, setHotAxis] = useState<AxisId | null>(null);
  const [branchOpen, setBranchOpen] = useState(false);
  const [fakeDoorOpen, setFakeDoorOpen] = useState<FakeDoorProduct | null>(null);

  const seedRef = useRef<HTMLDivElement>(null);
  const painRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const situationRef = useRef<HTMLDivElement>(null);
  const psychRef = useRef<HTMLDivElement>(null);
  const cellRefs: Record<AxisId, RefObject<HTMLDivElement>> = {
    seed: seedRef, pain: painRef, format: formatRef, situation: situationRef, psych: psychRef,
  };

  /** 덱 = 5축 혼합 — 취향·씨앗 앵커가 바뀔 때만 재구축 (buildDeck 내부는 80/20 가중) */
  const seedId = slots.seed?.id ?? null;
  const deckCards = useMemo(
    () => buildDeck(slots.seed, taste),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seedId, taste],
  );

  const cellContent = (axis: AxisId): CellContent | null => {
    if (axis === "seed" && slots.seed)
      return {
        emoji: "🌱",
        title: slots.seed.label,
        sub: slots.seed.track === "like" ? "내가 좋아하는 것" : "내가 잘 아는 것",
      };
    if (axis === "pain" && slots.pain) return { emoji: "😖", title: slots.pain.short, sub: slots.pain.label };
    if (axis === "format" && slots.format)
      return { emoji: "📦", title: slots.format.short, sub: slots.format.label };
    if (axis === "situation" && slots.situation) return { emoji: "🎬", title: slots.situation.label };
    if (axis === "psych" && slots.psych) return { emoji: "💭", title: slots.psych.label };
    return null;
  };
  const cellKey = (axis: AxisId): string => {
    const v = slots[axis];
    return v ? `${axis}:${typeof v === "object" && "id" in v ? v.id : ""}` : `${axis}:-`;
  };

  /** 빈 칸 탭 → 같은 풀에서 한 장 채움 (캡 미소모) */
  const fillEmpty = (axis: AxisId) => {
    const v: AxisValue =
      axis === "seed" ? { axis, seed: drawSeed(taste) }
      : axis === "pain" ? { axis, pain: drawPain(slots.seed, taste) }
      : axis === "format" ? { axis, format: drawFormat(slots.seed, taste) }
      : axis === "situation" ? { axis, item: drawSituation() }
      : { axis, item: drawPsych() };
    place(v);
  };

  const line = assembleLine(slots);
  const combo = useMemo(() => assembleCombo(slots), [slots]);
  const filled = filledRequired(slots).length;

  const onConfirm = () => {
    if (!combo) return;
    track("idea_confirmed", {
      seed_tag: combo.seed.id,
      combo: `${combo.pain.id}|${combo.format.id}`,
      is_golden: combo.golden,
      has_psych: !!slots.psych,
    });
    setBranchOpen(true);
  };

  const visibleAxes = AXES.filter((a) => !a.optional || psychOpen);

  return (
    <>
      <PageShell className="ambient pb-[330px] md:pb-[320px]">
        <TopBar
          right={
            <Pill aria-label={`오늘 전체 뽑기 ${spins} / ${SPIN_CAP}`}>
              🎰 <span className="tabular-nums text-ink">{Math.min(spins, SPIN_CAP)}/{SPIN_CAP}</span>
            </Pill>
          }
        />

        {/* 슬롯 행 — 필수 4칸 (+ 💭 옵션 등장 시 5칸) */}
        <div
          className={cn(
            "mx-auto mt-6 grid w-full max-w-[560px] gap-2 sm:gap-3",
            psychOpen ? "grid-cols-5" : "grid-cols-4",
          )}
        >
          {visibleAxes.map((ax, i) => (
            <SlotCell
              key={ax.id}
              ref={cellRefs[ax.id]}
              axisLabel={ax.label}
              axisEmoji={ax.emoji}
              gold={ax.id === "seed"}
              optional={ax.optional}
              hot={hotAxis === ax.id}
              locked={locked[ax.id]}
              floaty={!!combo}
              floatDelay={i}
              content={cellContent(ax.id)}
              contentKey={cellKey(ax.id)}
              onFill={() => fillEmpty(ax.id)}
              onSwap={() => swap(ax.id)}
              onRemove={() => removeAxis(ax.id)}
              onToggleLock={() => toggleLock(ax.id)}
            />
          ))}
        </div>

        {/* 결과 한 문장 — 필수 4칸이 다 찼을 때만 */}
        {line && combo && (
          <GlassCard className="mx-auto mt-6 w-full max-w-[560px] px-5 py-4 text-center">
            <p className="mb-1.5 text-[10px] tracking-[.16em] text-caption">오늘 만들어볼 한 개</p>
            <GoldSentence text={line} marks={[combo.pain.short, combo.format.short]} />
            {combo.golden && combo.title && (
              <p className="mt-2 text-xs text-gold">✨ {combo.title}</p>
            )}
          </GlassCard>
        )}

        {/* 액션 */}
        <div className="mx-auto mt-5 flex w-full max-w-[420px] items-center gap-2">
          <Button variant="glass" size="lg" className="flex-1 whitespace-nowrap px-3" onClick={() => spinAll()}>
            🎲 전체 다시 뽑기
          </Button>
          <Button variant="aurora" size="lg" className="flex-1" onClick={onConfirm} disabled={!combo}>
            ✓ 확정
          </Button>
        </div>
        {!combo && (
          <p className="mt-2 text-center text-xs text-caption">{filled}/{REQUIRED.length} — 카드를 채워주세요</p>
        )}
        {combo && (
          <p className="mt-2 text-center text-xs text-caption">
            마음에 드는 카드는 <b className="text-mist">🔒 고정</b> — 🎲에서 그대로 남고 나머지만 새로 나와요
          </p>
        )}

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={openTasteSheet}
            className="text-xs text-caption underline-offset-4 transition-colors hover:text-mist hover:underline"
          >
            취향 다시 고르기
          </button>
        </div>
      </PageShell>

      {/* 하단 전폭 부채꼴 덱 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <FanDeck
          cards={deckCards}
          getTargetRect={(axis) =>
            locked[axis] ? null : cellRefs[axis].current?.getBoundingClientRect() ?? null
          } /* 🔒 잠긴 축은 덱의 목적지에서 제외 — 드롭·탭 비행이 조준하지 못한다 */
          onDragOver={setHotAxis}
          onPick={place}
          onRequestSlot={(axis) => {
            if (axis === "psych") openPsych();
          }}
        />
      </div>

      {/* 중간 취향 질문 — 씨앗 고정 대체 */}
      <TasteSheet open={tasteSheetOpen} onSubmit={setTaste} onSkip={skipTaste} />

      {/* S1b 페이월① — 캡 소진 */}
      <PaywallSheet
        open={capHit}
        onClose={() => useSlot.setState({ capHit: false })}
        onShareBoost={() => {
          // 목업: +3회 = 스핀 카운트를 2로 되감기 (캡 강제는 4주 범위 밖)
          useSlot.setState({ spins: 2, capHit: false });
        }}
        onDayPass={() => {
          fakeDoor("day_pass", 1900, { paywall: "spin_cap", seed_tag: seedId });
          useSlot.setState({ capHit: false });
          setFakeDoorOpen("day_pass");
        }}
      />

      {/* 확정 분기 */}
      <ConfirmBranch
        open={branchOpen}
        combo={combo}
        line={line}
        onClose={() => setBranchOpen(false)}
        onPlan={() => {
          fakeDoor("plan", 990, { seed_tag: seedId });
          setFakeDoorOpen("plan");
        }}
      />

      <FakeDoorSheet
        open={fakeDoorOpen !== null}
        onClose={() => setFakeDoorOpen(null)}
        product={fakeDoorOpen ?? "plan"}
        title={fakeDoorOpen === "day_pass" ? "실행 패스" : "4주 실행 플랜"}
      />
    </>
  );
}
