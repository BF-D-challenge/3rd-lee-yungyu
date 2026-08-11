import type { MatpinPlaceCandidate } from "@/lib/matpin/contract";

type StationSeed = {
  name: string;
  latitude: number;
  longitude: number;
};

export type MatpinStationMatch = {
  name: string;
  distanceMeters: number | null;
  isStation: boolean;
};

const COUNTRY_NAMES: Record<string, string> = {
  KR: "대한민국",
  JP: "일본",
  US: "미국",
  CN: "중국",
  TW: "대만",
  HK: "홍콩",
  SG: "싱가포르",
  TH: "태국",
  VN: "베트남",
};

// CC0 station coordinates adapted from:
// https://gist.github.com/nemorize/ac5f39ff62b6bf82dc496d10c69b2b46
// The MVP starts with the Seoul areas represented by current Matpin saves.
const SEOUL_STATIONS: StationSeed[] = [
  { name: "강남역", latitude: 37.4979, longitude: 127.0276 },
  { name: "역삼역", latitude: 37.5006, longitude: 127.0364 },
  { name: "신논현역", latitude: 37.5046, longitude: 127.025 },
  { name: "논현역", latitude: 37.511, longitude: 127.0214 },
  { name: "언주역", latitude: 37.5073, longitude: 127.0339 },
  { name: "선정릉역", latitude: 37.5109, longitude: 127.0437 },
  { name: "선릉역", latitude: 37.5045, longitude: 127.049 },
  { name: "강남구청역", latitude: 37.5171, longitude: 127.0413 },
  { name: "학동역", latitude: 37.5143, longitude: 127.0316 },
  { name: "청담역", latitude: 37.5194, longitude: 127.0533 },
  { name: "봉은사역", latitude: 37.5142, longitude: 127.0602 },
  { name: "삼성역", latitude: 37.5088, longitude: 127.0632 },
  { name: "대치역", latitude: 37.494612, longitude: 127.063642 },
  { name: "한티역", latitude: 37.4962, longitude: 127.0529 },
  { name: "도곡역", latitude: 37.490858, longitude: 127.055381 },
  { name: "매봉역", latitude: 37.4869, longitude: 127.0468 },
  { name: "양재역", latitude: 37.4841, longitude: 127.0347 },
  { name: "구룡역", latitude: 37.486839, longitude: 127.058856 },
  { name: "개포동역", latitude: 37.4892, longitude: 127.0665 },
  { name: "대모산입구역", latitude: 37.491814, longitude: 127.072503 },
  { name: "한강진역", latitude: 37.5397, longitude: 127.0017 },
  { name: "이태원역", latitude: 37.5345, longitude: 126.9946 },
  { name: "성수역", latitude: 37.5441, longitude: 127.0558 },
  { name: "뚝섬역", latitude: 37.5472, longitude: 127.0476 },
  { name: "서울숲역", latitude: 37.5435, longitude: 127.0447 },
  { name: "을지로3가역", latitude: 37.5663, longitude: 126.9911 },
  { name: "을지로입구역", latitude: 37.566, longitude: 126.9827 },
  { name: "종로3가역", latitude: 37.5716, longitude: 126.9919 },
  { name: "회현역", latitude: 37.5585, longitude: 126.9782 },
  { name: "명동역", latitude: 37.5609, longitude: 126.9862 },
  { name: "충무로역", latitude: 37.5613, longitude: 126.9941 },
  { name: "홍대입구역", latitude: 37.5572, longitude: 126.9254 },
  { name: "합정역", latitude: 37.5495, longitude: 126.9137 },
  { name: "망원역", latitude: 37.556, longitude: 126.9101 },
  { name: "잠실역", latitude: 37.5133, longitude: 127.1002 },
  { name: "석촌역", latitude: 37.5054, longitude: 127.1069 },
  { name: "송파역", latitude: 37.4997, longitude: 127.1122 },
];

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const earthRadius = 6_371_000;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB))
    * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function isWithinSouthKorea(latitude: number, longitude: number): boolean {
  return latitude >= 33 && latitude <= 39.5 && longitude >= 124 && longitude <= 132;
}

export function stationForMatpinPlace(place: MatpinPlaceCandidate): MatpinStationMatch {
  if (place.nearbyTransit) {
    return {
      name: place.nearbyTransit.name,
      distanceMeters: place.nearbyTransit.distanceMeters,
      isStation: true,
    };
  }

  const countryCode = place.countryCode;
  if (countryCode !== "KR" && (!isWithinSouthKorea(place.latitude, place.longitude) || Boolean(countryCode))) {
    const country = countryCode ? (COUNTRY_NAMES[countryCode] ?? countryCode) : null;
    return {
      name: [country, place.regionName || place.area || "해외 장소"].filter(Boolean).join(" "),
      distanceMeters: null,
      isStation: false,
    };
  }

  const explicit = [place.area, place.address, place.matchReason]
    .join(" ")
    .match(/([가-힣A-Za-z0-9·]+역)(?:\s|$|[,.·])/u)?.[1];
  if (explicit) return { name: explicit, distanceMeters: null, isStation: true };

  const nearest = SEOUL_STATIONS
    .map((station) => ({
      ...station,
      distanceMeters: distanceMeters(
        place.latitude,
        place.longitude,
        station.latitude,
        station.longitude,
      ),
    }))
    .sort((left, right) => left.distanceMeters - right.distanceMeters)[0];

  if (nearest && nearest.distanceMeters <= 1_800) {
    return { name: nearest.name, distanceMeters: nearest.distanceMeters, isStation: true };
  }

  return {
    name: `${place.area || "지역"} 주변`,
    distanceMeters: null,
    isStation: false,
  };
}

export function walkingMinutes(distance: number | null): number | null {
  if (distance === null) return null;
  return Math.max(1, Math.round(distance / 75));
}
