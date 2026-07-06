import { CtaLink } from "./cta-link";

/**
 * 히어로 — f11-4510ms.jpg 프레임 그대로:
 * 순흑 배경 중앙에 9:16 aurora 카드 하나 + 아래 pill CTA 하나.
 * 인트로 D단계의 안착 지점: entrance="settle"이면 카드가 풀블리드에서
 * settle-to-card로 축소 안착한다 (인트로 마지막 프레임 = 히어로 첫 프레임).
 */

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

export interface HeroProps {
  /** settle: 인트로에서 이어지는 원 컨티뉴어스 샷 · static: 인트로 생략 시 정적 */
  entrance: "settle" | "static";
}

export function Hero({ entrance }: HeroProps) {
  const settling = entrance === "settle";
  const below = settling
    ? { animation: `fade-up 0.9s ${EASE} 0.5s both` }
    : undefined;

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-8 py-10 text-center">
      {/* 상단 작은 워드마크 (TopBar 아님 — 텍스트만) */}
      <p data-anim className="font-serif text-sm tracking-tight text-mist" style={below}>
        오늘 해볼까
      </p>

      {/* 중앙 9:16 aurora 카드 — 인트로가 안착하는 그 카드 */}
      <div
        data-anim
        className="aurora flex aspect-[9/16] w-[240px] flex-col items-center justify-center gap-4 rounded-card p-6 lg:w-[280px]"
        style={settling ? { animation: `settle-to-card 1.1s ${EASE} both` } : undefined}
      >
        <h1 className="font-serif text-3xl tracking-tight text-ink lg:text-4xl">오늘 해볼까</h1>
        <p className="text-sm leading-relaxed text-ink/70">
          좋아하는 것 하나로,
          <br />
          오늘 만들 한 개
        </p>
      </div>

      <div data-anim className="flex flex-col items-center gap-6" style={below}>
        <p className="text-base text-mist">뭘 만들지 몰라도, 좋아하는 것 하나면 돼요.</p>

        <CtaLink href="/slot" position="hero">
          🎰 바로 뽑아보기
        </CtaLink>

        <p className="text-xs text-caption">
          현재까지 1,024명이 오늘 만들 걸 정했어요 · 투표 받는 지인에겐 로그인 없음
        </p>
      </div>
    </section>
  );
}
