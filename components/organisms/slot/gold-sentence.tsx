"use client";

import type { ReactNode } from "react";

/** 결과 한 문장에서 슬롯 값(불편·형태)만 골드 하이라이트 */
export function GoldSentence({ text, marks }: { text: string; marks: string[] }) {
  let parts: ReactNode[] = [text];
  marks
    .filter(Boolean)
    .forEach((m, mi) => {
      parts = parts.flatMap((p) => {
        if (typeof p !== "string" || !p.includes(m)) return [p];
        const out: ReactNode[] = [];
        p.split(m).forEach((s, i) => {
          if (i)
            out.push(
              <b key={`${mi}-${i}`} className="font-semibold text-gold">
                {m}
              </b>,
            );
          if (s) out.push(s);
        });
        return out;
      });
    });
  return <p className="font-serif text-base leading-relaxed text-ink sm:text-lg">{parts}</p>;
}
