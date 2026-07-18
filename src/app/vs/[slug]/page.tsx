// [S5-VS] A/B 응원 대결 수신자 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
// 서버 컴포넌트: 카톡 인앱 브라우저 등 링크 미리보기(OG)를 위해 generateMetadata를 여기서 처리한다.
// (DuelPanel 자체는 "use client"라 그대로 import해 렌더링 — App Router 표준 패턴)
import type { Metadata } from "next";
import { DuelPanel } from "@/components/organisms/journey/duel-panel";
import { painById } from "@/lib/combos";
import { decodeDuelSlug, type CardPayload } from "@/lib/share";

const DEFAULT_TITLE = "오늘 해볼까";
const DEFAULT_DESCRIPTION = "친구 둘 중 어느 쪽을 응원할지 골라주세요.";
type DuelPageProps = { params: Promise<{ slug: string }> };

/** publish-card.tsx의 cardTitle과 동일한 우선순위(appName > title > 씨앗×불편) — "use client" 모듈 간 RSC 경계를 피하려 로컬 재구현 */
function cardTitle(payload: CardPayload): string {
  if (payload.appName) return payload.appName;
  if (payload.title) return payload.title;
  const pain = painById(payload.painId);
  return pain ? `${payload.seedLabel} × ${pain.short}` : payload.seedLabel;
}

export async function generateMetadata({ params }: DuelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const duel = decodeDuelSlug(slug);
  if (!duel) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      openGraph: { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, type: "website" },
      twitter: { card: "summary" },
    };
  }

  const titleA = cardTitle(duel.a);
  const titleB = cardTitle(duel.b);
  const title = `${titleA} vs ${titleB} — 어느 쪽이 나아?`;
  const description = duel.a.oneliner ?? duel.b.oneliner ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary" },
  };
}

export default async function DuelPage({ params }: DuelPageProps) {
  const { slug } = await params;
  return <DuelPanel slug={slug} />;
}
