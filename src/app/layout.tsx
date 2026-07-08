import type { Metadata, Viewport } from "next";
import { Work_Sans, Playfair_Display, Pinyon_Script } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-swash" });

export const metadata: Metadata = {
  title: "오늘 해볼까 — 내 것에서 시작해, 오늘 바로",
  description: "좋아하는 것 하나만 고르면 오늘 만들 1개를 뽑고, 지인에게 수요를 물어봐 드려요.",
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
