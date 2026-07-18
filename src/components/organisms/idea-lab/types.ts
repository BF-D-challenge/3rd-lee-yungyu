import type { KakaoShareResult } from "@/lib/kakao-share";

export const IDEA_LAB_AXIS_IDS = ["source", "payer", "moment", "twist"] as const;

export type IdeaLabAxisId = (typeof IDEA_LAB_AXIS_IDS)[number];
export type IdeaLabPlatform = "web" | "app" | "plugin";
export type IdeaLabChangeKind = "add" | "remove" | "replace";

export interface IdeaLabAxisMeta {
  id: IdeaLabAxisId;
  label: string;
  question: string;
  color: string;
  softColor: string;
}

export interface IdeaLabOption {
  id: string;
  value: string;
  detail: string;
}

export interface IdeaLabSourceOption extends IdeaLabOption {
  sourceName: string;
  platform: IdeaLabPlatform;
  evidence: string;
  preservedFlow: string;
}

export type IdeaLabResearchDataset =
  | "trustmrr"
  | "app_store"
  | "chrome_web_store"
  | "deep_research";

export type IdeaLabResearchKey = `${IdeaLabResearchDataset}:${string}`;

export interface IdeaLabResearchReference {
  key: IdeaLabResearchKey;
  url: string;
}

/** 앱에 미리 검수해 넣는 원본만 정규 연구 장부의 정확한 키와 URL을 가진다. */
export interface IdeaLabCatalogSourceOption extends IdeaLabSourceOption {
  research: IdeaLabResearchReference;
}

export interface IdeaLabTwistOption extends IdeaLabOption {
  kind: IdeaLabChangeKind;
  resultTitle: string;
  platform: IdeaLabPlatform;
  smallestBuild: string;
}

export interface IdeaLabScenario {
  id: string;
  source: IdeaLabCatalogSourceOption;
  payers: IdeaLabOption[];
  moments: IdeaLabOption[];
  twists: IdeaLabTwistOption[];
}

export interface IdeaLabSelection {
  source: IdeaLabSourceOption;
  payer: IdeaLabOption;
  moment: IdeaLabOption;
  twist: IdeaLabTwistOption;
}

export interface IdeaLabSharePayload {
  title: string;
  summary: string;
  /** 아이디어의 포지셔닝·가설·두 독립 프롬프트를 모두 담은 전체 브리프 */
  prompt: string;
  /** AI 코딩 도구의 새 프로젝트 첫 메시지로 바로 쓰는 독립 산출물 */
  developmentPrompt: string;
  /** 이미지 생성 AI에 바로 쓰는 독립 산출물 */
  imagePrompt: string;
  platform: IdeaLabPlatform;
  selection: IdeaLabSelection;
}

export type IdeaLabShareResult = KakaoShareResult;

export interface IdeaLabProps {
  initialScenarioId?: string;
  /** 실제 앱에 연결할 때 카카오톡 공유 화면을 연 결과를 돌려준다. 성공한 경우에만 전체 브리프와 독립 프롬프트 2종이 열린다. */
  onShare?: (payload: IdeaLabSharePayload) => IdeaLabShareResult | Promise<IdeaLabShareResult>;
  /** 네 장이 완성될 때 최신 공유 초안을 상위 화면에 전달한다. */
  onDraftReady?: (payload: IdeaLabSharePayload) => void;
  /** A3 공유 완료 화면의 "오늘의 칭찬 보러가기" — 탭 셸이 뷰 전환을 담당한다. */
  onViewPraise?: () => void;
  className?: string;
}
