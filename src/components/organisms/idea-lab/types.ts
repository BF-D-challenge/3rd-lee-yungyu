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
  | "chrome_web_store";

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
  prompt: string;
  platform: IdeaLabPlatform;
  selection: IdeaLabSelection;
}

export interface IdeaLabShareResult {
  ok: boolean;
  method: "native" | "clipboard";
}

export interface IdeaLabProps {
  initialScenarioId?: string;
  /** 실제 앱에 연결할 때 공유 결과를 돌려준다. 성공한 경우에만 전체 제작 문구가 열린다. */
  onShare?: (payload: IdeaLabSharePayload) => IdeaLabShareResult | Promise<IdeaLabShareResult>;
  /** 네 장이 완성될 때 최신 공유 초안을 상위 화면에 전달한다. */
  onDraftReady?: (payload: IdeaLabSharePayload) => void;
  /** A3 공유 완료 화면의 "오늘의 칭찬 보러가기" — 탭 셸이 뷰 전환을 담당한다. */
  onViewPraise?: () => void;
  className?: string;
}
