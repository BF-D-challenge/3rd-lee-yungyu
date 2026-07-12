"use client";

/**
 * [FourCard] 부채꼴 밀집 덱 — slot/fan-deck.tsx의 제네릭 이식본.
 * 원본 로직(슬리버 밀집 부채꼴 · rAF 드리프트 1.1°/s · 진입 스윕 · 보이는 호만 렌더 + 화면 밖
 * recycle · 호버 풀아웃 · 드래그 틸트 · 탭/드롭 → 아크 비행 → 슬롯 안착 · 낙하 버림 ·
 * `_hov` 플래그 정리 버그픽스 · sweptRef 진입 스윕 1회 · RM 가드)은 무수정 보존한다.
 *
 * 슬롯 계보와의 차이(제네릭화):
 *  - `@/lib/pools`(AxisId 5축) 결합 제거 → 로컬 `DeckCard = { axis; key; label }`, 축은 전부 string.
 *  - AXIS_KO 하드코딩 삭제 → props `axisLabels: Record<string,string>`(aria-label 용).
 *  - axisValueKey(card) → card.key (poolKey 정체성).
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { backSvg } from "../slot/card-back";

export type DeckCard = { axis: string; key: string; label: string };

export interface FanDeckHandle {
  /** 한 번에 뽑기 한 스텝 (원본 autoAll) — 아펙스 카드를 axis 칸으로 비행, 안착 시 onPick→onDone */
  drawTo: (axis: string, onDone: () => void) => boolean;
  /** 자동 시퀀스 동안 벨트 잠금 (원본 autoAll의 busy 유지 — 탭/드래그 차단 + 호버 크롤 .05) */
  hold: (on: boolean) => void;
}

export interface FanDeckProps {
  cards: DeckCard[];
  /** 축 → 사람이 읽는 라벨 (aria-label) */
  axisLabels: Record<string, string>;
  /** 모달/시트가 떠 있을 때 덱 입력과 진행 중 드래그를 막는다. */
  disabled?: boolean;
  /** false면 덱은 장식·비행 출발점만 담당하고 사용자 입력은 받지 않는다. drawTo는 계속 사용할 수 있다. */
  interactive?: boolean;
  /** 프로그램 비행 시간. 기존 슬롯은 560ms를 사용한다. */
  flightDurationMs?: number;
  /** 현재 조준 축 = 다음 빈 필수 칸 (원본 curAxis). null이면 게이트 해제 → 카드 고유 축 */
  aimAxis: string | null;
  /** 게이트 해제 후 비활성 축(🔒 잠긴 축) — 해당 축 카드는 dim + 조준 불가 */
  inactiveAxes?: string[];
  /** 카드가 날아가 안착할 슬롯 칸의 뷰포트 rect — 잠긴/없는 축만 null */
  getTargetRect: (axis: string) => DOMRect | null;
  /** 드래그 중 슬롯 위 하이라이트용 (null = 벗어남) */
  onDragOver: (axis: string | null) => void;
  /** 아크 비행이 슬롯에 닿는 순간 호출 — 해당 축만 채움/교체 */
  onPick: (card: DeckCard) => void;
}

type WCard = HTMLDivElement & { _base: number; _hov?: boolean; _deck: number; _skin?: string };

const EASE = "cubic-bezier(.65,0,.35,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";

const DECK_CSS = `
.fd-host{pointer-events:none;
  mask-image:linear-gradient(to right,transparent 0,#000 9%,#000 91%,transparent 100%),
              linear-gradient(to top,transparent 0,#000 18%);
  mask-composite:intersect;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 9%,#000 91%,transparent 100%),
                       linear-gradient(to top,transparent 0,#000 18%);
  -webkit-mask-composite:source-in}
.fd-wheel{position:absolute;left:50%;width:0;height:0;will-change:transform;z-index:5}
.fd-card{position:absolute;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;
  -webkit-user-select:none;will-change:transform;transition:transform .8s ${EASE},opacity .5s ease}
.fd-card.noT{transition:opacity .5s ease}
.fd-card .pull{position:absolute;inset:0;transition:transform .26s ${SPRING}}
.fd-card:hover .pull,.fd-card:focus-visible .pull{transform:translateY(-30px) scale(1.03)}
.fd-card:hover{z-index:600!important}
.fd-card svg{display:block;width:100%;height:100%}
.fd-card:hover svg{filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}
.fd-card.ghost{visibility:hidden}
.fd-card[data-active="false"]{opacity:.35;cursor:default}
.fd-card[data-active="false"] .pull,.fd-card[data-active="false"]:hover .pull{transform:none}
.fd-host[data-disabled="true"] .fd-card{pointer-events:none}
.fd-host[data-interactive="false"] .fd-card{pointer-events:none;cursor:default}
.fd-fly{position:fixed;z-index:30;pointer-events:none;will-change:transform}
.fd-fly svg{display:block;width:100%;height:100%;filter:drop-shadow(0 16px 22px rgba(0,0,0,.55))}
@media (prefers-reduced-motion:reduce){.fd-card,.fd-card .pull{transition:none}}
`;

export const FanDeck = forwardRef<FanDeckHandle, FanDeckProps>(function FanDeck(
  {
    cards,
    axisLabels,
    disabled = false,
    interactive = true,
    flightDurationMs = 560,
    aimAxis,
    inactiveAxes,
    getTargetRect,
    onDragOver,
    onPick,
  },
  handleRef,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // 최신 props를 이펙트 폐쇄부에서 읽기 위한 refs (덱 재구축 없이 갱신)
  const getRectRef = useRef(getTargetRect);
  getRectRef.current = getTargetRect;
  const onDragOverRef = useRef(onDragOver);
  onDragOverRef.current = onDragOver;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const flightDurationRef = useRef(flightDurationMs);
  flightDurationRef.current = flightDurationMs;
  const axisLabelsRef = useRef(axisLabels);
  axisLabelsRef.current = axisLabels;

  // curAxis 게이트 상태 — 스킨(뒷면/aria/data-*)만 바꾸고 휠은 재구축하지 않는다 (진입 스윕 보존)
  const aimRef = useRef(aimAxis);
  aimRef.current = aimAxis;
  const inactiveKey = (inactiveAxes ?? []).join(",");
  const inactiveRef = useRef<Set<string>>(new Set());
  inactiveRef.current = new Set(inactiveAxes ?? []);
  const skinRef = useRef<(() => void) | null>(null);
  const apiRef = useRef<FanDeckHandle | null>(null);

  useImperativeHandle(
    handleRef,
    () => ({
      drawTo: (axis, onDone) => apiRef.current?.drawTo(axis, onDone) ?? false,
      hold: (on) => apiRef.current?.hold(on),
    }),
    [],
  );

  // 조준 축·잠금 축이 바뀌면 카드 스킨만 갱신
  useEffect(() => {
    skinRef.current?.();
  }, [aimAxis, inactiveKey]);

  const poolKey = useMemo(() => cards.map((c) => c.key).join(","), [cards]);
  const poolRef = useRef(cards);
  poolRef.current = cards;
  /** 진입 스윕은 첫 등장에서만 — 풀 재구축 시 재생하지 않는다 (원본: 벨트는 리셋 전까지 유지) */
  const sweptRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    const wheel = wheelRef.current;
    const pool = poolRef.current;
    if (!host || !wheel || pool.length === 0) return;

    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const easeIO = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

    let cardsEl: WCard[] = [];
    let busy = false;
    let held = false; // 한 번에 뽑기 시퀀스 동안 벨트 잠금 (원본 autoAll busy)
    let disposed = false;
    let wheelAngle = 0;
    let speed = 0;
    const BASE = 1.1;
    const targetSpeed = RM ? 0 : BASE;
    let hoverSlow = 0;
    let entered = sweptRef.current; // 재구축이면 스윕 생략
    let entT0: number | null = null;
    let last = 0;
    let raf = 0;
    let wasMobile: boolean;
    const flies = new Set<HTMLDivElement>();
    let WP = { spacing: 1, n: 0 };

    // 앱 전체가 ≤480px 모바일 컬럼으로 통일됨 → 덱은 모바일 파라미터만 사용(반경 640·카드 84×122·슬리버 12px).
    const mobile = () => true;
    const geom = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const r = 640;
      const cw = 84;
      const ch = 122;
      return { w, h, r, cw, ch, cy: h + r - 150 }; // 원본 실측: 아펙스 카드 중심 150px
    };
    const wheelParams = () => {
      const g = geom();
      const spacing = ((12 / g.r) * 180) / Math.PI; // 슬리버 12px
      // +6 — mask-image 페이드 뒤로 카드가 부족해 틈이 보이지 않게 하는 culling 버퍼(D9 deckClipFix)
      const halfVis = (Math.asin(Math.min(0.95, (g.w / 2 + g.cw) / g.r)) * 180) / Math.PI + 6;
      return { spacing, n: Math.ceil((2 * halfVis) / spacing) };
    };

    const applyCardT = (c: WCard, instant: boolean) => {
      const g = geom();
      if (instant) c.classList.add("noT");
      c.style.transform = `rotate(${c._base}deg) translateY(${-g.r}px)`;
      if (instant)
        requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove("noT")));
    };
    const restack = () => {
      cardsEl
        .slice()
        .sort((a, b) => a._base - b._base)
        .forEach((c, i) => (c.style.zIndex = String(i)));
    };
    const positionWheel = () => {
      wheel.style.top = `${geom().cy}px`;
      cardsEl.forEach((c) => applyCardT(c, true));
    };
    const recycle = () => {
      const span = cardsEl.length * WP.spacing;
      let jumped = false;
      cardsEl.forEach((c) => {
        let a = c._base + wheelAngle;
        a = ((((a + 180) % 360) + 720) % 360) - 180;
        if (a > span / 2) {
          c._base -= span;
          applyCardT(c, true);
          jumped = true;
        } else if (a < -span / 2) {
          c._base += span;
          applyCardT(c, true);
          jumped = true;
        }
      });
      if (jumped) restack();
    };
    const absAngle = (c: WCard) => {
      let a = (c._base + wheelAngle) % 360;
      if (a > 180) a -= 360;
      if (a < -180) a += 360;
      return a;
    };
    /** 원본 apexCard — 조준선(12시)에 가장 가까운 카드. autoAll이 뽑는 카드 */
    const apexCard = (): WCard | null => {
      let best: WCard | null = null;
      let bd = Infinity;
      cardsEl.forEach((c) => {
        const a = Math.abs(absAngle(c));
        if (a < bd) {
          bd = a;
          best = c;
        }
      });
      return best;
    };

    const deckOf = (c: WCard): DeckCard => pool[c._deck % pool.length];
    /** 원본 curAxis 게이트 — 조준 축이 있는 동안 모든 카드는 그 축의 카드다 */
    const effAxis = (c: WCard): string => aimRef.current ?? deckOf(c).axis;
    /** 게이트 중엔 전 카드 활성(원본: 벨트 전체가 curAxis로 향함), 해제 후엔 🔒 축만 비활성 */
    const isActive = (c: WCard) => (aimRef.current ? true : !inactiveRef.current.has(deckOf(c).axis));
    /** 카드 스킨 — data-axis/data-active/aria/뒷면 글리프를 유효 축에 맞춘다 (재구축 없음) */
    const skin = (c: WCard) => {
      const eff = effAxis(c);
      c.dataset.axis = eff;
      c.dataset.active = String(isActive(c));
      if (interactiveRef.current)
        c.setAttribute("aria-label", `${axisLabelsRef.current[eff] ?? eff} 카드 뽑기`);
      if (c._skin !== eff) {
        c._skin = eff;
        const pull = c.firstElementChild as HTMLElement | null;
        if (pull) pull.innerHTML = backSvg();
      }
    };

    const makeClone = (cx: number, cy: number, ang: number, w: number, h: number) => {
      const c = document.createElement("div");
      c.className = "fd-fly";
      c.style.left = `${cx - w / 2}px`;
      c.style.top = `${cy - h / 2}px`;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.style.transform = `rotate(${ang}deg)`;
      c.innerHTML = backSvg();
      document.body.appendChild(c);
      flies.add(c);
      return c;
    };
    const dropClone = (c: HTMLDivElement) => {
      flies.delete(c);
      c.remove();
    };

    const flyTo = (
      clone: HTMLDivElement,
      c0: { x: number; y: number },
      ang0: number,
      toRect: DOMRect,
      done: () => void,
    ) => {
      // translate는 클론의 실제 DOM 기준점(left/top) 기준 — 드롭 위치≠기준점이어도 안 튄다
      const bx = parseFloat(clone.style.left) + parseFloat(clone.style.width) / 2;
      const by = parseFloat(clone.style.top) + parseFloat(clone.style.height) / 2;
      const s0 = parseFloat(clone.dataset.s0 || "1");
      const c2 = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };
      const c1 = { x: (c0.x + c2.x) / 2, y: Math.min(c0.y, c2.y) - 120 };
      const w0 = parseFloat(clone.style.width);
      const s2 = toRect.width / w0;
      const D = RM ? 0 : flightDurationRef.current;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = D ? Math.min(1, (now - t0) / D) : 1;
        const e = easeIO(p);
        const x = (1 - e) * (1 - e) * c0.x + 2 * (1 - e) * e * c1.x + e * e * c2.x;
        const y = (1 - e) * (1 - e) * c0.y + 2 * (1 - e) * e * c1.y + e * e * c2.y;
        clone.style.transform = `translate(${x - bx}px,${y - by}px) rotate(${ang0 * (1 - e)}deg) scale(${s0 + (s2 - s0) * e})`;
        if (p < 1) requestAnimationFrame(step);
        else {
          dropClone(clone);
          done();
        }
      };
      requestAnimationFrame(step);
    };

    /** ★버그픽스 이식: 카드 제거 시 _hov가 남아 있으면 hoverSlow 누수 → 휠 영구 감속 */
    const removeCard = (c: WCard) => {
      if (c._hov) {
        c._hov = false;
        hoverSlow = Math.max(0, hoverSlow - 1);
      }
      const i = cardsEl.indexOf(c);
      if (i > -1) cardsEl.splice(i, 1);
      const b = c._base;
      c.remove();
      cardsEl.forEach((o) => {
        if (o._base > b) {
          o._base -= WP.spacing;
          applyCardT(o, false);
        }
      });
      restack();
    };

    /** 릴 밖에 놓으면 그 자리에서 아래로 낙하해 버려진다 (제자리 복귀 X) */
    const fallAway = (clone: HTMLDivElement, c: WCard, ox: number, oy: number) => {
      if (RM) {
        dropClone(clone);
        busy = false;
        if (!disposed) removeCard(c);
        return;
      }
      const cr = clone.getBoundingClientRect();
      const x0 = cr.left + cr.width / 2;
      const y0 = cr.top + cr.height / 2;
      const dur = 560;
      const t0 = performance.now();
      const dist = innerHeight - y0 + 260;
      const rot = (x0 > innerWidth / 2 ? 1 : -1) * (6 + ((Math.round(y0) * 7) % 9));
      const fall = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = p * p; // 가속 = 중력감
        clone.style.opacity = String(1 - e * 0.85);
        clone.style.transform = `translate(${x0 - ox}px,${y0 - oy + dist * e}px) rotate(${rot * e}deg) scale(${1 - e * 0.08})`;
        if (p < 1) requestAnimationFrame(fall);
        else {
          dropClone(clone);
          busy = false;
          if (!disposed) removeCard(c);
        }
      };
      requestAnimationFrame(fall);
    };

    /** 탭 → 유효 축(조준 중엔 curAxis) 슬롯으로 아크 비행 → 안착 시 onPick.
     *  목적지 rect는 조준 칸이 있을 때만 존재 — 없으면 무시. */
    const drawToReel = (c: WCard) => {
      if (!interactiveRef.current || disabledRef.current || busy || held || !isActive(c)) return;
      const card = deckOf(c);
      const eff = effAxis(c);
      const rect = getRectRef.current(eff);
      if (!rect) return;
      busy = true;
      const gm = geom();
      const b = c.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const a0 = absAngle(c);
      c.classList.add("ghost");
      const clone = makeClone(cx, cy, a0, gm.cw, gm.ch);
      flyTo(clone, { x: cx, y: cy }, a0, rect, () => {
        busy = false;
        if (disposed) return;
        removeCard(c);
        onPickRef.current(card);
      });
    };

    /** 호버 풀아웃 + 드래그 틸트 + 드롭/탭 (원본 attach 이식) */
    const attach = (c: WCard) => {
      let pid: number | null = null;
      let sx = 0;
      let sy = 0;
      let drag = false;
      let clone: (HTMLDivElement & { _rot?: number; _commit?: boolean }) | null = null;
      let ox = 0;
      let oy = 0;
      let vx = 0;
      let lx = 0;
      c.addEventListener("pointerenter", () => {
        if (!c._hov) {
          c._hov = true;
          hoverSlow++;
        }
      });
      c.addEventListener("pointerleave", () => {
        if (c._hov) {
          c._hov = false;
          hoverSlow = Math.max(0, hoverSlow - 1);
        }
      });
      c.addEventListener("pointerdown", (e) => {
        if (!interactiveRef.current || disabledRef.current || busy || held || !isActive(c)) return; // 원본: busy||curAxis()<0 게이트의 다크 등가
        pid = e.pointerId;
        c.setPointerCapture(pid);
        sx = e.clientX;
        sy = e.clientY;
        drag = false;
        vx = 0;
        lx = e.clientX;
      });
      c.addEventListener("pointermove", (e) => {
        if (pid === null) return;
        if (disabledRef.current) {
          cancel();
          return;
        }
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        if (!drag && Math.hypot(dx, dy) > 7) {
          drag = true;
          busy = true;
          const g = geom();
          const b = c.getBoundingClientRect();
          ox = b.left + b.width / 2;
          oy = b.top + b.height / 2;
          clone = makeClone(ox, oy, absAngle(c), g.cw, g.ch);
          c.classList.add("ghost");
        }
        if (drag && clone) {
          vx = vx * 0.8 + (e.clientX - lx) * 0.2;
          lx = e.clientX;
          const rot = Math.max(-9, Math.min(9, vx * 0.55)); // 드래그 틸트
          clone._rot = rot;
          clone.dataset.s0 = "1.05";
          clone.style.transform = `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(1.05)`;
          const axis = effAxis(c); // 조준 중엔 curAxis 슬롯만 hot (원본과 동일 마진 ±34/+40)
          const r = getRectRef.current(axis);
          const over =
            !!r &&
            e.clientX > r.left - 34 &&
            e.clientX < r.right + 34 &&
            e.clientY > r.top - 34 &&
            e.clientY < r.bottom + 40;
          clone._commit = over;
          onDragOverRef.current(over ? axis : null);
        }
      });
      const up = () => {
        if (pid === null) return;
        if (disabledRef.current) {
          cancel();
          return;
        }
        try {
          c.releasePointerCapture(pid);
        } catch {
          /* already released */
        }
        pid = null;
        onDragOverRef.current(null);
        if (!drag) {
          drawToReel(c); // 탭 → 유효 축 릴로 (조준 중엔 curAxis)
          return;
        }
        const card = deckOf(c);
        const rect = getRectRef.current(effAxis(c));
        if (clone && clone._commit && rect) {
          const cr = clone.getBoundingClientRect();
          flyTo(clone, { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2 }, clone._rot || 0, rect, () => {
            busy = false;
            if (disposed) return;
            removeCard(c);
            onPickRef.current(card);
          });
          clone = null;
        } else if (clone) {
          fallAway(clone, c, ox, oy); // 릴 밖 → 낙하 버림
          clone = null;
        } else busy = false;
        drag = false;
      };
      /** 제스처 취소는 탭/드롭으로 오해하지 않고 깨끗이 정리 (원본 codex #3) */
      const cancel = () => {
        if (pid === null) return;
        try {
          c.releasePointerCapture(pid);
        } catch {
          /* already released */
        }
        pid = null;
        onDragOverRef.current(null);
        if (clone) {
          dropClone(clone);
          clone = null;
          c.classList.remove("ghost");
        }
        drag = false;
        busy = false;
      };
      c.addEventListener("pointerup", up);
      c.addEventListener("pointercancel", cancel);
      c.addEventListener("keydown", (e) => {
        if (
          interactiveRef.current &&
          (e.key === "Enter" || e.key === " ") &&
          !disabledRef.current &&
          !busy &&
          !held &&
          isActive(c)
        ) {
          e.preventDefault();
          drawToReel(c);
        }
      });
    };

    const buildWheel = () => {
      wheel.innerHTML = "";
      cardsEl = [];
      WP = wheelParams();
      wasMobile = mobile();
      const g = geom();
      const span = WP.n * WP.spacing;
      for (let i = 0; i < WP.n; i++) {
        const c = document.createElement("div") as WCard;
        c.className = "fd-card";
        c.style.width = `${g.cw}px`;
        c.style.height = `${g.ch}px`;
        c.style.left = `${-g.cw / 2}px`;
        c.style.top = `${-g.ch / 2}px`;
        if (interactiveRef.current) {
          c.setAttribute("role", "button");
          c.setAttribute("tabindex", "0");
        } else {
          c.setAttribute("aria-hidden", "true");
        }
        c.innerHTML = `<div class="pull"></div>`;
        c._base = -span / 2 + (i + 0.5) * WP.spacing;
        c._deck = i;
        skin(c); // 뒷면 글리프·aria·data-axis/active — 조준 축 반영
        applyCardT(c, true);
        wheel.appendChild(c);
        cardsEl.push(c);
        attach(c);
        if (!RM)
          c.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 600,
            delay: 120 + i * 6,
            easing: "ease-out",
            fill: "backwards",
          });
      }
      restack();
      positionWheel();
    };

    const loop = (now: number) => {
      if (disposed) return;
      if (!entT0) entT0 = now;
      if (!entered) {
        const p = Math.min(1, (now - entT0) / (RM ? 1 : 3200));
        wheelAngle = -12 * (1 - easeIO(p)); // 진입 스윕
        if (p >= 1) {
          entered = true;
          sweptRef.current = true; // 완주한 뒤에만 기록 — StrictMode 재실행에도 첫 스윕 보장
          last = now;
        }
      } else {
        const dt = Math.min(0.05, (now - (last || now)) / 1000);
        last = now;
        const t = targetSpeed * (hoverSlow ? (busy || held ? 0.05 : 0.25) : 1);
        speed += (t - speed) * Math.min(1, dt * 3);
        wheelAngle = (wheelAngle + speed * dt) % 360; // 드리프트 1.1°/s
        recycle();
      }
      wheel.style.transform = `rotate(${wheelAngle}deg)`;
      raf = requestAnimationFrame(loop);
    };

    let rz: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        if (disposed) return;
        if (mobile() !== wasMobile) buildWheel(); // 브레이크포인트 전환 → 재구축
        else positionWheel();
      }, 150);
    };
    addEventListener("resize", onResize);

    buildWheel();
    raf = requestAnimationFrame(loop);

    skinRef.current = () => cardsEl.forEach(skin);
    // 한 번에 뽑기 핸들 (원본 autoAll의 1스텝) — 부모가 430ms 간격으로 순차 호출한다.
    apiRef.current = {
      hold: (on) => {
        held = on;
      },
      drawTo: (axis, onDone) => {
        if (disabledRef.current || busy || disposed) return false;
        const rect = getRectRef.current(axis);
        const c = apexCard();
        if (!rect || !c) return false;
        busy = true;
        const gm = geom();
        const b = c.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const a0 = absAngle(c);
        c.classList.add("ghost");
        const clone = makeClone(cx, cy, a0, gm.cw, gm.ch);
        flyTo(clone, { x: cx, y: cy }, a0, rect, () => {
          busy = false;
          if (disposed) return;
          const card = deckOf(c);
          removeCard(c);
          onPickRef.current(card);
          onDone();
        });
        return true;
      },
    };

    return () => {
      disposed = true;
      skinRef.current = null;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      clearTimeout(rz);
      removeEventListener("resize", onResize);
      flies.forEach((f) => f.remove());
      flies.clear();
      wheel.innerHTML = "";
    };
    // poolKey와 disabled가 덱 정체성 — disabled 전환 시 진행 중 body 클론까지 cleanup한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, flightDurationMs, interactive, poolKey]);

  return (
    <div
      ref={hostRef}
      className="fd-host absolute inset-0 h-full w-full overflow-hidden"
      data-disabled={disabled ? "true" : undefined}
      data-interactive={interactive ? undefined : "false"}
      aria-label={interactive ? "카드 덱 — 끌어 놓거나 탭해서 칸을 채워보세요" : "카드 덱"}
      aria-hidden={interactive ? undefined : true}
    >
      <style suppressHydrationWarning>{DECK_CSS}</style>
      <div ref={wheelRef} className="fd-wheel" />
    </div>
  );
});
