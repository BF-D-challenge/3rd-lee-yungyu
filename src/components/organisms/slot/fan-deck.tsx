"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { axisValueKey, type AxisId, type AxisValue } from "@/lib/pools";
import {
  FanDeck as SharedFanDeck,
  type DeckCard,
  type FanDeckHandle as SharedFanDeckHandle,
} from "../four-card/four-card-deck";

export interface FanDeckHandle {
  drawTo: (axis: AxisId, onDone: () => void, skipMotion?: boolean) => boolean;
  hold: (on: boolean) => void;
  previewAt: (position: number | null) => void;
}

export interface FanDeckProps {
  cards: AxisValue[];
  disabled?: boolean;
  interactive?: boolean;
  flightDurationMs?: number;
  aimAxis: AxisId | null;
  inactiveAxes?: AxisId[];
  getTargetRect: (axis: AxisId) => DOMRect | null;
  onDragOver: (axis: AxisId | null) => void;
  onPick: (card: AxisValue) => void;
}

const AXIS_LABELS: Record<AxisId, string> = {
  seed: "씨앗",
  pain: "불편",
  format: "형태",
  situation: "장면",
  psych: "마음",
};

type SlotDeckCard = DeckCard & { value: AxisValue };

/** 이전 슬롯 도메인 타입을 공통 덱의 문자열 축 타입으로만 변환한다. */
export const FanDeck = forwardRef<FanDeckHandle, FanDeckProps>(function FanDeck(
  {
    cards,
    disabled,
    interactive,
    flightDurationMs,
    aimAxis,
    inactiveAxes,
    getTargetRect,
    onDragOver,
    onPick,
  },
  handleRef,
) {
  const sharedRef = useRef<SharedFanDeckHandle>(null);
  const deckCards = useMemo<SlotDeckCard[]>(
    () => cards.map((value) => ({
      axis: value.axis,
      key: axisValueKey(value),
      label: AXIS_LABELS[value.axis],
      value,
    })),
    [cards],
  );

  useImperativeHandle(handleRef, () => ({
    drawTo: (axis, onDone, skipMotion) =>
      sharedRef.current?.drawTo(axis, onDone, skipMotion) ?? false,
    hold: (on) => sharedRef.current?.hold(on),
    previewAt: (position) => sharedRef.current?.previewAt(position),
  }), []);

  return (
    <SharedFanDeck
      ref={sharedRef}
      cards={deckCards}
      variant="responsive"
      axisLabels={AXIS_LABELS}
      disabled={disabled}
      interactive={interactive}
      flightDurationMs={flightDurationMs}
      aimAxis={aimAxis}
      inactiveAxes={inactiveAxes}
      getTargetRect={(axis) => getTargetRect(axis as AxisId)}
      onDragOver={(axis) => onDragOver(axis as AxisId | null)}
      onPick={(card) => onPick((card as SlotDeckCard).value)}
    />
  );
});
