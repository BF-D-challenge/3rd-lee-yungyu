// [S5] 수신자 공개 카드 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
// 서버 컴포넌트: 카톡 인앱 브라우저 등 링크 미리보기(OG)를 위해 generateMetadata를 여기서 처리한다.
// (VotePanel 자체는 "use client"라 그대로 import해 렌더링 — App Router 표준 패턴)
import type { Metadata } from "next";
import { VotePanel } from "@/components/organisms/journey/vote-panel";
import { painById } from "@/lib/combos";
import { decodeSlug, type CardPayload } from "@/lib/share";

const DEFAULT_TITLE = "오늘 해볼까";
const DEFAULT_DESCRIPTION = "친구가 뽑은 카드를 확인하고 응원해주세요.";

/** publish-card.tsx의 cardTitle과 동일한 우선순위(appName > title > 씨앗×불편) — "use client" 모듈 간 RSC 경계를 피하려 로컬 재구현 */
function cardTitle(payload: CardPayload): string {
  if (payload.appName) return payload.appName;
  if (payload.title) return payload.title;
  const pain = painById(payload.painId);
  return pain ? `${payload.seedLabel} × ${pain.short}` : payload.seedLabel;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const payload = decodeSlug(params.slug);
  if (!payload) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      openGraph: { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, type: "website" },
      twitter: { card: "summary" },
    };
  }

  const title = cardTitle(payload);
  const description = payload.oneliner ?? payload.evidence ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary" },
  };
}

export default function PublicCardPage({ params }: { params: { slug: string } }) {
  return <VotePanel slug={params.slug} />;
}
