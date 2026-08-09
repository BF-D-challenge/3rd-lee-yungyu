import type { Metadata } from "next";
import { MatpinMobileFramePrototype } from "@/components/organisms/tastepin/matpin-mobile-frame";

const matpinPublicUrl = "https://matpin-kr.vercel.app";
const matpinTitle = "맛핀 | 맛집 게시물을 역별로 자동 정리";
const matpinDescription = "Instagram에서 matpin.kr 계정으로 맛집 게시물을 보내면 장소를 확인해 가까운 역별 보관함에 정리해요.";
const matpinSocialImage = `${matpinPublicUrl}/images/matpick/matpin-instagram-share-flow.png`;

export const metadata: Metadata = {
  title: matpinTitle,
  description: matpinDescription,
  alternates: { canonical: `${matpinPublicUrl}/matpin` },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${matpinPublicUrl}/matpin`,
    siteName: "맛핀",
    title: matpinTitle,
    description: matpinDescription,
    images: [{
      url: matpinSocialImage,
      width: 1672,
      height: 941,
      alt: "Instagram 맛집 게시물을 matpin.kr로 보내 지도에 자동 정리하는 맛핀 이용 방법",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: matpinTitle,
    description: matpinDescription,
    images: [matpinSocialImage],
  },
};

export default function MatpinPage() {
  return <MatpinMobileFramePrototype variant="landing" />;
}
