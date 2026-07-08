import { CtaLink } from "./cta-link";

/** 최종 CTA — 세리프 한 줄 + 히어로와 같은 pill CTA */
export function FinalCta() {
  return (
    <section className="py-20 text-center lg:py-28">
      <h2 className="font-serif text-3xl leading-snug text-ink">오늘, 시작해 볼까요?</h2>
      <div className="mt-9">
        <CtaLink href="/slot" position="final">
          🎰 바로 뽑아보기
        </CtaLink>
      </div>
    </section>
  );
}
