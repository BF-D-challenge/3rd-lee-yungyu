/** 어떻게 되나요 — 세로 3단, 각 한 줄 (아이콘 + 텍스트만) + 씨앗 카테고리 아트 갤러리 */

import { CATEGORY_ART, type CategoryId } from "@/lib/card-art";

const CATEGORY_ORDER: CategoryId[] = ["fitness", "food", "content", "dev", "commerce", "marketing"];

const STEPS = [
  { emoji: "🌱", text: "좋아하는 걸 하나 고르면" },
  { emoji: "🎰", text: "오늘 만들 한 개를 뽑고" },
  { emoji: "🗳", text: "지인 12명이 3초 투표" },
];

export function HowItWorks() {
  return (
    <section className="py-16 text-center lg:py-20">
      <h2 className="font-serif text-2xl text-ink">어떻게 되나요</h2>

      <ul className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
        {STEPS.map((s) => (
          <li key={s.text} className="glass flex items-center gap-3 rounded-pill px-5 py-3 text-left">
            <span aria-hidden className="text-xl">
              {s.emoji}
            </span>
            <span className="text-sm text-ink">{s.text}</span>
          </li>
        ))}
      </ul>

      {/* 씨앗 카테고리 아트 갤러리 — 오로라 v2, 라이브 택소노미 6종과 1:1 (lib/card-art CATEGORY_ART) */}
      <p className="mt-12 text-xs tracking-[.14em] text-caption">이런 분야에서 오늘 하나</p>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-3">
        {CATEGORY_ORDER.map((k) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={k} src={CATEGORY_ART[k]} alt="" className="aspect-square w-full rounded-input object-cover opacity-90" />
        ))}
      </div>
    </section>
  );
}
