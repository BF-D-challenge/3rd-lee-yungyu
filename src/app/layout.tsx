import type { Metadata, Viewport } from "next";
import { Work_Sans, Playfair_Display, Pinyon_Script } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-swash" });

export const metadata: Metadata = {
  title: "오늘 해볼까 — 검증된 제품에서 한 끗만 바꿔, 오늘 만들 1개",
  description: "카드 4장이면 이미 돈이 벌리는 제품에서 한 끗만 바꾼 오늘 만들 1개가 나와요. 공유하면 지인의 익명 칭찬이 매일 한 장씩 도착해요.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${workSans.variable} ${playfair.variable} ${pinyon.variable}`}>
      <body className="ambient min-h-dvh">{children}</body>
    </html>
  );
}
