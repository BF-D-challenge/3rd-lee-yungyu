import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatpinSaved } from "@/components/organisms/tastepin/matpin-saved";
import type { MatpinPublicProfile } from "@/lib/matpin/contract";
import { normalizeInstagramHandle } from "@/lib/instagram-handle";
import { readMatpinPublicProfile } from "@/lib/matpin/store";

export const dynamic = "force-dynamic";

const e2eProfile: MatpinPublicProfile = {
  username: "public_foodie_e2e",
  places: [
    ["DbTBhcZNY1b", "산장장작구이", "한식", "서울 강남구 봉은사로30길 70 1층", 37.5029761, 127.0367068],
    ["C3kGesnvLr2", "돝고기506", "한식", "서울 강남구 역삼로17길 53", 37.4963358, 127.0362866],
    ["DMSqZGLSOA9", "치솟 역삼본점", "일식", "서울 강남구 봉은사로30길 59 1층 102호", 37.5036927, 127.0366875],
  ].map(([reelId, name, category, address, latitude, longitude]) => ({
    reelId: String(reelId),
    reelUrl: `https://www.instagram.com/reel/${String(reelId)}/`,
    place: {
      name: String(name),
      area: "서울 강남구",
      category: String(category),
      address: String(address),
      latitude: Number(latitude),
      longitude: Number(longitude),
      mapUrl: `https://maps.google.com/?q=${encodeURIComponent(String(name))}`,
    },
  })),
};

function e2ePublicProfile(username: string): MatpinPublicProfile | null {
  if (process.env.NEXT_PUBLIC_E2E !== "1") return null;
  return normalizeInstagramHandle(username) === e2eProfile.username ? e2eProfile : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const username = normalizeInstagramHandle((await params).username);
  if (!username) return { robots: { index: false, follow: false } };
  const url = `https://matpin-kr.vercel.app/@${username}`;
  return {
    title: `@${username}의 맛집 보관함 | 맛핀`,
    description: `@${username} 공개 보관함에 저장된 Instagram 게시물 속 장소를 확인합니다.`,
    alternates: { canonical: url },
    referrer: "no-referrer",
    robots: { index: false, follow: false },
  };
}

export default async function MatpinPublicSavedPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = process.env.NEXT_PUBLIC_E2E === "1"
    ? e2ePublicProfile(username)
    : await readMatpinPublicProfile(username);
  if (!profile) notFound();
  return <MatpinSaved publicProfile={profile} />;
}
