import {
  tastepinLibraryResponseSchema,
  type TastepinInstagramMention,
  type TastepinLibraryPlace,
  type TastepinLibraryResponse,
  type TastepinYoutubeMention,
} from "@/lib/tastepin-library-contract";
import { distanceInMeters, type Coordinates } from "@/lib/tastepin-distance";

const DEFAULT_ORIGIN = {
  mode: "demo_station" as const,
  label: "강남역 · 역삼역 주변",
  latitude: 37.5007,
  longitude: 127.0327,
};

const stationCollectionSeeds = [
  {
    id: "gangnam-station",
    station: "강남역",
    title: "강남역 모음",
    description: "강남역에서 걸어갈 수 있는 공개 원본 맛집",
  },
  {
    id: "yeoksam-station",
    station: "역삼역",
    title: "역삼역 모음",
    description: "역삼역 점심과 회식에 바로 고를 수 있는 맛집",
  },
  {
    id: "sinnonhyeon-station",
    station: "신논현역",
    title: "신논현역 모음",
    description: "신논현역에서 걸어갈 수 있는 공개 원본 맛집",
    placeIds: ["gangnam-jeonseol-woodaegalbi"],
  },
] as const;

const googleMapsSearch = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const youtubeMention = (
  id: string,
  title: string,
  channel: string,
  duration: string,
  metadata?: {
    viewCount: number;
    publishedAt: string;
    kind?: TastepinYoutubeMention["kind"];
  },
): TastepinYoutubeMention => ({
  id,
  kind: metadata?.kind ?? "video",
  title,
  channel,
  duration,
  url: `https://www.youtube.com/watch?v=${id}`,
  thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  viewCount: metadata?.viewCount ?? null,
  publishedAt: metadata?.publishedAt ?? null,
});

const instagramMention = (
  id: string,
  kind: TastepinInstagramMention["kind"],
  title: string,
  creator: string,
  publishedAt?: string,
  thumbnailUrl?: string,
): TastepinInstagramMention => {
  const path = kind === "reel" ? "reel" : "p";
  const url = `https://www.instagram.com/${path}/${id}/`;

  return {
    id,
    kind,
    title,
    creator,
    url,
    embedUrl: `${url}embed/captioned/`,
    thumbnailUrl: thumbnailUrl ?? null,
    publishedAt: publishedAt ?? null,
  };
};

type PlaceSeed = Omit<TastepinLibraryPlace, "distanceMeters" | "instagramMentions"> & {
  instagramMentions?: TastepinInstagramMention[];
};

const placeSeeds: PlaceSeed[] = [
  {
    id: "seongsu-potato",
    name: "소문난성수감자탕",
    area: "성수",
    category: "한식",
    occasion: "친구와",
    address: "서울 성동구 성수동2가",
    latitude: 37.5428,
    longitude: 127.0545,
    mapUrl: googleMapsSearch("소문난성수감자탕"),
    source: {
      platform: "instagram_reel",
      creator: "@seoul_eats",
      url: null,
    },
    youtubeMentions: [
      youtubeMention(
        "MAIrp4WYAx4",
        "[sub] 성시경의 먹을텐데 l 성수 감자탕",
        "성시경 SUNG SI KYUNG",
        "21:17",
      ),
      youtubeMention(
        "vTiU6iuoyUk",
        "백종원, 성시경도 극찬한 성수동 감자탕 맛집",
        "뭐묵지",
        "4:37",
      ),
    ],
    savedAt: "2026-07-26T11:10:00.000Z",
  },
  {
    id: "seongsu-cafe",
    name: "카멜커피 성수",
    area: "성수",
    category: "카페",
    occasion: "혼자",
    address: "서울 성동구 성수동2가",
    latitude: 37.5436,
    longitude: 127.0568,
    mapUrl: googleMapsSearch("카멜커피 성수"),
    source: {
      platform: "instagram_reel",
      creator: "@coffee.archive",
      url: null,
    },
    youtubeMentions: [
      youtubeMention(
        "_RPpvU3An9c",
        "카멜커피 성수점! 핫플카페 CEO가 말해주는 이야기",
        "미스터카멜",
        "17:14",
      ),
      youtubeMention(
        "EfBWyDWvf4A",
        "성수동 카페 추천 | 카멜커피 성수점",
        "랜선음식점",
        "1:01",
      ),
    ],
    savedAt: "2026-07-25T06:35:00.000Z",
  },
  {
    id: "euljiro-jewel",
    name: "을지로보석",
    area: "을지로",
    category: "한식",
    occasion: "데이트",
    address: "서울 중구 을지로3가",
    latitude: 37.5661,
    longitude: 126.9918,
    mapUrl: googleMapsSearch("을지로보석"),
    source: {
      platform: "instagram_reel",
      creator: "@table_for_two",
      url: null,
    },
    youtubeMentions: [
      youtubeMention(
        "8o44o4zuUhI",
        "[MY EATS LIST] 을지로보석 셰프의 최애 메뉴는?",
        "쿠팡이츠",
        "4:02",
      ),
      youtubeMention(
        "pO2oHr5zM14",
        "내 맛집을 소개합니다 | 을지로 보석",
        "비밀이야 bimirya",
        "12:32",
      ),
    ],
    savedAt: "2026-07-23T10:05:00.000Z",
  },
  {
    id: "gangnam-tamtam",
    name: "땀땀 강남점",
    area: "강남역",
    category: "아시안",
    occasion: "혼자",
    address: "서울 강남구 강남대로98길 12-5",
    latitude: 37.5004003,
    longitude: 127.0279865,
    mapUrl: googleMapsSearch("땀땀 강남점"),
    source: {
      platform: "instagram_reel",
      creator: "@gangnam_foodnote",
      url: null,
    },
    youtubeMentions: [
      youtubeMention(
        "DSITMWp6EQE",
        "해장하러 왔다가 맥주 한 잔 더 하고 가는 매운 소곱창 쌀국수",
        "tvN Joy",
        "19:14",
        { viewCount: 21_780, publishedAt: "2023-06-14" },
      ),
      youtubeMention(
        "d01o1j-wJGs",
        "강남역 땀땀, 일반 쌀국수와 비교불가!",
        "음식중개사 food broker",
        "8:15",
        { viewCount: 2_074, publishedAt: "2024-04-30" },
      ),
    ],
    savedAt: "2026-07-27T01:42:00.000Z",
  },
  {
    id: "gangnam-jangin",
    name: "장인닭갈비 강남점",
    area: "강남역",
    category: "한식",
    occasion: "친구와",
    address: "서울 강남구 테헤란로1길 19",
    latitude: 37.4996023,
    longitude: 127.0275167,
    mapUrl: googleMapsSearch("장인닭갈비 강남점"),
    source: {
      platform: "instagram_reel",
      creator: "@afterwork_table",
      url: null,
    },
    youtubeMentions: [
      youtubeMention(
        "YyBvaHcTzyM",
        "강남역 터줏대감 닭갈비집 장인닭갈비",
        "우노링",
        "1:01",
        { viewCount: 474, publishedAt: "2023-02-25" },
      ),
      youtubeMention(
        "Kv5pD220hLM",
        "평일에도 줄 서는 강남역 치즈폭포닭갈비",
        "음식중개사 food broker",
        "7:21",
        { viewCount: 681, publishedAt: "2024-05-17" },
      ),
    ],
    savedAt: "2026-07-27T02:05:00.000Z",
  },
  {
    id: "gangnam-jeonseol-woodaegalbi",
    name: "전설의우대갈비 강남직영점",
    area: "강남역",
    category: "한식",
    occasion: "회식",
    address: "서울 강남구 강남대로94길 10 3층 1호",
    latitude: 37.4991955,
    longitude: 127.0282138,
    mapUrl: googleMapsSearch("전설의우대갈비 강남직영점"),
    source: {
      platform: "youtube_shorts",
      creator: "이트락고깃간",
      url: "https://www.youtube.com/watch?v=7A2bO534ZSc",
    },
    youtubeMentions: [
      youtubeMention(
        "7A2bO534ZSc",
        "강남 직장인을 위한 프라이빗 룸식당",
        "이트락고깃간",
        "0:24",
        { viewCount: 193, publishedAt: "2026-07-28", kind: "shorts" },
      ),
    ],
    savedAt: "2026-07-28T09:57:13.000Z",
  },
  {
    id: "gangnam-myeongdong-kalguksu",
    name: "명동손칼국수",
    area: "강남역",
    category: "한식",
    occasion: "혼자",
    address: "서울 강남구 강남대로66길 6",
    latitude: 37.491848,
    longitude: 127.0316363,
    mapUrl: googleMapsSearch("명동손칼국수 강남대로66길"),
    source: {
      platform: "youtube_shorts",
      creator: "뽐내니 스튜디오",
      url: "https://www.youtube.com/watch?v=iRz1uCj5yc8",
    },
    youtubeMentions: [
      youtubeMention(
        "iRz1uCj5yc8",
        "강남역 직장인 점심, 명동손칼국수 보쌈정식",
        "뽐내니 스튜디오",
        "0:16",
        { viewCount: 249, publishedAt: "2026-07-28", kind: "shorts" },
      ),
    ],
    savedAt: "2026-07-28T09:57:13.000Z",
  },
  {
    id: "yeoksam-daewoo",
    name: "대우부대찌개",
    area: "역삼역",
    category: "한식",
    occasion: "직장동료와",
    address: "서울 강남구 테헤란로25길 34",
    latitude: 37.5026764,
    longitude: 127.0352154,
    mapUrl: googleMapsSearch("대우부대찌개 역삼"),
    source: {
      platform: "instagram_post",
      creator: "@heokw",
      url: "https://www.instagram.com/p/CfBVa_Qhi8o/",
    },
    instagramMentions: [
      instagramMention(
        "CfBVa_Qhi8o",
        "post",
        "미나리와 한우가 들어간 대우부대찌개",
        "@heokw",
      ),
    ],
    youtubeMentions: [
      youtubeMention(
        "lQ9le3dqrRk",
        "성시경의 먹을텐데 | 역삼동 대우부대찌개",
        "성시경 SUNG SI KYUNG",
        "24:33",
        { viewCount: 1_999_398, publishedAt: "2022-10-29" },
      ),
      youtubeMention(
        "0qTcrMeF5zk",
        "역삼동 대우부대찌개, 국물맛이 좋지만 하나가 아쉬운!?",
        "음식머법관 bupgwani",
        "5:07",
        { viewCount: 2_348, publishedAt: "2023-05-16" },
      ),
    ],
    savedAt: "2026-07-27T02:24:00.000Z",
  },
  {
    id: "yeoksam-dotgogi",
    name: "돝고기506",
    area: "역삼역",
    category: "한식",
    occasion: "회식",
    address: "서울 강남구 역삼로17길 53",
    latitude: 37.4963358,
    longitude: 127.0362866,
    mapUrl: googleMapsSearch("돝고기506"),
    source: {
      platform: "instagram_reel",
      creator: "@dot506_",
      url: "https://www.instagram.com/reel/C3kGesnvLr2/",
    },
    instagramMentions: [
      instagramMention(
        "C3kGesnvLr2",
        "reel",
        "506시간 숙성 돼지고기",
        "@dot506_",
      ),
    ],
    youtubeMentions: [
      youtubeMention(
        "MZ8Oj1DoGrY",
        "역삼역 숙성고기 맛집, 506시간 숙성했다고?!",
        "미트북 MeatBook",
        "8:08",
        { viewCount: 527, publishedAt: "2024-11-06" },
      ),
      youtubeMention(
        "G2Ol2X9p25E",
        "506시간 동안 숙성시켰다는 삼겹살을 먹어봤습니다",
        "코우지 TV [더 상생]",
        "8:18",
        { viewCount: 82_153, publishedAt: "2020-07-08" },
      ),
    ],
    savedAt: "2026-07-27T02:41:00.000Z",
  },
  {
    id: "yeoksam-chisot",
    name: "치솟 역삼본점",
    area: "역삼역",
    category: "일식",
    occasion: "데이트",
    address: "서울 강남구 봉은사로30길 59 1층 102호",
    latitude: 37.5036927,
    longitude: 127.0366875,
    mapUrl: googleMapsSearch("치솟 역삼본점"),
    source: {
      platform: "instagram_reel",
      creator: "@muk._.suzy_",
      url: "https://www.instagram.com/reel/DMSqZGLSOA9/",
    },
    instagramMentions: [
      instagramMention(
        "DMSqZGLSOA9",
        "reel",
        "연어와 장어덮밥을 함께 고르는 역삼 일식집",
        "@muk._.suzy_",
        "2025-07-19",
      ),
    ],
    youtubeMentions: [
      youtubeMention(
        "G-t0aaNjFjI",
        "웨이팅 14팀, 역삼동 치솟",
        "인천맛집 서울맛집 경기맛집",
        "0:27",
        { viewCount: 143_240, publishedAt: "2025-10-22", kind: "shorts" },
      ),
    ],
    savedAt: "2026-07-28T09:57:13.000Z",
  },
  {
    id: "yeoksam-sanjang",
    name: "산장장작구이",
    area: "역삼역",
    category: "한식",
    occasion: "회식",
    address: "서울 강남구 봉은사로30길 70 1층",
    latitude: 37.5029761,
    longitude: 127.0367068,
    mapUrl: googleMapsSearch("산장장작구이 역삼"),
    source: {
      platform: "instagram_reel",
      creator: "@mattjun11",
      url: "https://www.instagram.com/reel/DbTBhcZNY1b/",
    },
    instagramMentions: [
      instagramMention(
        "DbTBhcZNY1b",
        "reel",
        "지리산 흑돼지 껍데기 삼겹",
        "@mattjun11",
        "2026-07-27",
        "/images/matpick/yeoksam-sanjang-reel.jpg",
      ),
    ],
    youtubeMentions: [],
    savedAt: "2026-07-28T09:57:13.000Z",
  },
  {
    id: "gangnam-noodle",
    name: "진미평양냉면",
    area: "강남",
    category: "한식",
    occasion: "가족과",
    address: "서울 강남구 논현동",
    latitude: 37.5168,
    longitude: 127.0361,
    mapUrl: googleMapsSearch("진미평양냉면"),
    source: {
      platform: "instagram_reel",
      creator: "@noodle.notes",
      url: null,
    },
    youtubeMentions: [
      youtubeMention(
        "H_Aw-akvQPQ",
        "[sub] 성시경의 먹을텐데 | 논현동 진미평양냉면",
        "성시경 SUNG SI KYUNG",
        "19:34",
      ),
      youtubeMention(
        "I5WhonHmC-k",
        "햇님과 나도의 인생 평양냉면 맛집 투어",
        "햇도시락HDSR",
        "27:54",
      ),
    ],
    savedAt: "2026-07-21T04:50:00.000Z",
  },
];

const withDistance = (origin: Coordinates, place: PlaceSeed): TastepinLibraryPlace => ({
  ...place,
  instagramMentions: place.instagramMentions ?? [],
  distanceMeters: distanceInMeters(origin, place),
});

export function createTastepinLibrary(
  coordinates?: Coordinates,
): TastepinLibraryResponse {
  const origin = coordinates
    ? {
        mode: "device" as const,
        label: "내 위치 주변",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }
    : DEFAULT_ORIGIN;
  const places = placeSeeds
    .map((place) => withDistance(origin, place))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return tastepinLibraryResponseSchema.parse({
    mode: "demo",
    collection: {
      title: "Instagram에서 모은 맛집",
      visibility: "private",
      updatedAt: "2026-07-28T09:57:13.000Z",
    },
    origin,
    ranking: {
      metric: "youtube_total_views",
      label: "공개 YouTube 누적 조회수",
      checkedAt: "2026-07-28T09:57:13.000Z",
      caveat: "최근 증가량이 아니라 확인 시점의 누적 조회수 합계예요.",
    },
    stationCollections: stationCollectionSeeds.map((collection) => ({
      ...collection,
      placeIds: "placeIds" in collection
        ? [...collection.placeIds]
        : places
          .filter((place) => place.area === collection.station)
          .map((place) => place.id),
    })),
    places,
  });
}
