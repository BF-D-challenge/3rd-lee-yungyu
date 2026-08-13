import type { MatpinPlaceType } from "@/lib/matpin/contract";

export type MatpinGlobalPlaceInputFixture = {
  label: string;
  name: string;
  placeType: MatpinPlaceType;
  regionHints: string[];
  result: {
    id: string;
    name: string;
    address: string;
    category: string;
    latitude: number;
    longitude: number;
  };
};

export const MATPIN_GLOBAL_PLACE_INPUT_FIXTURES: MatpinGlobalPlaceInputFixture[] = [
  {
    label: "일본 카페",
    name: "블루보틀 커피 키요스미 시라카와",
    placeType: "cafe",
    regionHints: ["일본 도쿄 기요스미시라카와"],
    result: {
      id: "places/blue-bottle-kiyosumi",
      name: "Blue Bottle Coffee Kiyosumi",
      address: "東京都江東区平野1-4-8, Japan",
      category: "Cafe",
      latitude: 35.6804,
      longitude: 139.7991,
    },
  },
  {
    label: "일본 관광지",
    name: "浅草寺",
    placeType: "attraction",
    regionHints: ["일본 도쿄 아사쿠사"],
    result: {
      id: "places/senso-ji",
      name: "浅草寺",
      address: "東京都台東区浅草2-3-1, Japan",
      category: "Buddhist temple",
      latitude: 35.7148,
      longitude: 139.7967,
    },
  },
  {
    label: "일본 숙소",
    name: "파크 하얏트 도쿄",
    placeType: "lodging",
    regionHints: ["일본 도쿄 신주쿠"],
    result: {
      id: "places/park-hyatt-tokyo",
      name: "Park Hyatt Tokyo",
      address: "東京都新宿区西新宿3-7-1-2, Japan",
      category: "Hotel",
      latitude: 35.6852,
      longitude: 139.6909,
    },
  },
];
