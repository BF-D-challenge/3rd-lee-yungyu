"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** FAQ — 3문 아코디언 (순수 React state) */

const FAQS = [
  {
    q: "정말 칩만 골라도 되나요?",
    a: "네. 고르기부터 뽑기까지 전부 칩 탭으로 끝나요. 딱 맞는 칩이 없으면 맨 끝의 ‘직접 쓸래요’로 적을 수도 있어요.",
  },
  {
    q: "친구가 귀찮아하지 않을까요?",
    a: "링크를 열고 버튼 하나 누르면 3초면 끝나요. 로그인도, 앱 설치도 없어요.",
  },
  {
    q: "얼마나 걸리나요?",
    a: "고르기부터 오늘 만들 한 개 뽑기까지 5분이면 충분해요. 투표는 지인들이 각자 3초씩 해줘요.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 lg:py-20">
      <h2 className="mb-8 text-center font-serif text-2xl text-ink">자주 묻는 질문</h2>

      <div className="flex flex-col gap-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={cn("rounded-card", isOpen ? "glass-strong" : "glass")}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold text-ink">{f.q}</span>
                <span
                  aria-hidden
                  className={cn(
                    "shrink-0 text-mist transition-transform duration-200",
                    isOpen && "rotate-45 text-gold",
                  )}
                >
                  +
                </span>
              </button>
              {isOpen && <p className="px-6 pb-6 text-sm leading-relaxed text-mist">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
