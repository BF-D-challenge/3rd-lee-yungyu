"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { LoaderCircle, MousePointer2 } from "lucide-react";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import {
  checkAuthSession,
  consumeAuthPending,
  type AuthSession,
} from "@/lib/auth-session";
import { track } from "@/lib/track";
import {
  FanDeck,
  type DeckCard,
  type FanDeckHandle,
} from "../four-card";

type GateState =
  | { status: "checking"; session: null }
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: AuthSession };

const PREVIEW_AXES = ["source", "twist", "payer", "moment"] as const;
const PREVIEW_AXIS_LABELS: Record<(typeof PREVIEW_AXES)[number], string> = {
  source: "원본",
  twist: "변주",
  payer: "사용자",
  moment: "순간",
};
const PREVIEW_CARDS: DeckCard[] = Array.from({ length: 24 }, (_, index) => {
  const axis = PREVIEW_AXES[index % PREVIEW_AXES.length];
  return {
    axis,
    key: `login-preview-${index}`,
    label: PREVIEW_AXIS_LABELS[axis],
  };
});
const AUTO_PREVIEW_STOPS = [-0.68, -0.24, 0.3, 0.7, 0.12, -0.48];

function InvertedDeckPreview() {
  const deckRef = useRef<FanDeckHandle>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState(AUTO_PREVIEW_STOPS[0]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener("change", syncMotion);
    return () => query.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const reducedTimer = window.setTimeout(() => deckRef.current?.previewAt(0), 80);
      return () => window.clearTimeout(reducedTimer);
    }
    if (!autoplay) return;

    let interval: number | null = null;
    let index = -1;
    const advance = () => {
      index = (index + 1) % AUTO_PREVIEW_STOPS.length;
      const next = AUTO_PREVIEW_STOPS[index];
      setCursorPosition(next);
      deckRef.current?.previewAt(next);
    };
    const startTimer = window.setTimeout(() => {
      advance();
      interval = window.setInterval(advance, 760);
    }, 180);

    return () => {
      window.clearTimeout(startTimer);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [autoplay, reducedMotion]);

  useEffect(() => () => {
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
  }, []);

  const pauseAutoplay = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || reducedMotion) return;
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setAutoplay(false);
  };

  const resumeAutoplay = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || reducedMotion) return;
    deckRef.current?.previewAt(null);
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      setAutoplay(true);
      resumeTimerRef.current = null;
    }, 900);
  };

  return (
    <div
      className="deck-preview relative left-1/2 h-[196px] w-[calc(100%+3rem)] max-w-[440px] -translate-x-1/2 overflow-hidden"
      data-auto-preview={reducedMotion ? "reduced" : autoplay ? "playing" : "paused"}
      onPointerEnter={pauseAutoplay}
      onPointerLeave={resumeAutoplay}
      aria-hidden="true"
    >
      <style>{`
        .deck-preview__fade {
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0,
            rgba(0,0,0,.3) 16px,
            #000 46px,
            #000 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0,
            rgba(0,0,0,.3) 16px,
            #000 46px,
            #000 100%
          );
        }
        .deck-preview__deck {
          transform: rotate(180deg) scale(.86);
          transform-origin: 50% 50%;
        }
        .deck-preview__cursor {
          opacity: 0;
          transform: translate3d(calc(-50% + var(--deck-cursor-shift)), 0, 0);
          transition:
            transform 520ms cubic-bezier(.65,0,.35,1),
            opacity 120ms ease-out;
          will-change: transform;
        }
        .deck-preview[data-auto-preview="playing"] .deck-preview__cursor {
          opacity: 1;
        }
        .deck-preview[data-auto-preview="paused"] .deck-preview__cursor {
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .deck-preview__cursor {
            display: none;
            transition: none;
          }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-x-10 top-8 h-28 rounded-full bg-primary/14 blur-3xl" />
      <div className="deck-preview__fade absolute inset-0">
        <div className="deck-preview__deck absolute inset-x-[-18px] top-0 h-[142px]">
          <FanDeck
            ref={deckRef}
            cards={PREVIEW_CARDS}
            variant="compact"
            axisLabels={PREVIEW_AXIS_LABELS}
            interactive
            previewOnly
            aimAxis={null}
            getTargetRect={() => null}
            onDragOver={() => undefined}
            onPick={() => undefined}
          />
        </div>
      </div>
      <div
        className="deck-preview__cursor pointer-events-none absolute left-1/2 top-[92px] z-20"
        style={{
          "--deck-cursor-shift": `${cursorPosition * 118}px`,
        } as CSSProperties}
      >
        <MousePointer2
          aria-hidden
          className="h-5 w-5 fill-bg text-white drop-shadow-[0_3px_7px_rgba(0,0,0,.7)]"
          strokeWidth={1.8}
        />
      </div>
    </div>
  );
}

function CheckingSplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg text-ink" role="status" aria-label="로그인 상태 확인 중">
      <div className="text-center">
        <LoaderCircle aria-hidden data-anim className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm font-bold text-mist">로그인 상태를 확인하고 있어요</p>
      </div>
    </div>
  );
}

export function CreatorAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: "checking", session: null });

  useEffect(() => {
    let active = true;
    void checkAuthSession().then((session) => {
      if (!active) return;
      if (!session) {
        track("view_login", { context: "creator", entry: "splash" });
        setState({ status: "anonymous", session: null });
        return;
      }
      if (consumeAuthPending("creator")) {
        track("auth_done", {
          context: "creator",
          method: session.demo ? "demo" : "google",
          entry: "splash",
        });
      }
      setState({ status: "authenticated", session });
    });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "checking") return <CheckingSplash />;
  if (state.status === "authenticated") return children;

  return (
    <div className="flex min-h-dvh justify-center bg-bg text-ink">
      <main className="relative flex min-h-dvh w-full max-w-[440px] flex-col overflow-x-hidden overflow-y-auto border-x border-white/[.05] bg-bg px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(320px 250px at 50% 30%, rgba(255,68,88,.13), transparent 70%), radial-gradient(260px 220px at 20% 75%, rgba(109,180,245,.08), transparent 70%)",
          }}
        />

        <header className="relative z-10 flex min-h-12 items-center">
          <span className="text-sm font-black tracking-[-.025em] text-primary">오늘 해볼까</span>
        </header>

        <section className="relative z-10 my-auto py-3 text-center" aria-labelledby="creator-login-title">
          <InvertedDeckPreview />
          <h1
            id="creator-login-title"
            className="mx-auto mt-3 max-w-[340px] text-[32px] font-extrabold leading-[1.16] tracking-[-.04em] text-ink"
          >
            <span className="block">오늘 뭐 만들지.</span>
            <span className="block">카드에게 물어보세요.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[300px] text-sm leading-6 text-mist">
            <span className="block">아무 생각 없이 네 장만 뽑아보세요.</span>
            <span className="block">오늘 시작할 아이디어가 나타나요.</span>
          </p>
        </section>

        <section className="relative z-10">
          <GoogleLoginButton
            context="creator"
            label="Google로 카드 뽑기"
            returnTo={typeof window === "undefined" ? "/" : window.location.href}
            onAuthenticated={(session) => setState({ status: "authenticated", session })}
          />
        </section>
      </main>
    </div>
  );
}
