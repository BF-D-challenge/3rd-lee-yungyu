/** 어떻게 되나요 — 세로 3단, 각 한 줄 (아이콘 + 텍스트만) */

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
    </section>
  );
}
