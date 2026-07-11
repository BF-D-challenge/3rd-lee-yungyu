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

export interface IdeaLabTwistOption extends IdeaLabOption {
  kind: IdeaLabChangeKind;
  resultTitle: string;
  platform: IdeaLabPlatform;
  smallestBuild: string;
}

export interface IdeaLabScenario {
  id: string;
  source: IdeaLabSourceOption;
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

export interface IdeaLabProps {
  initialScenarioId?: string;
  /** 실제 앱에 연결할 때 공유 성공 여부를 돌려준다. 성공한 경우에만 전체 제작 문구가 열린다. */
  onShare?: (payload: IdeaLabSharePayload) => boolean | Promise<boolean>;
  className?: string;
}
