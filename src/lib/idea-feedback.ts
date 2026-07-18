export const IDEA_FEEDBACK_MESSAGES = {
  understood: "무슨 앱인지 바로 이해됐어요",
  wantToUse: "실제로 써보고 싶어요",
  needsDifference: "차별점이 더 선명하면 좋겠어요",
} as const;

export interface IdeaFeedbackSummary {
  total: number;
  understood: number;
  wantToUse: number;
  needsDifference: number;
  custom: number;
}

export type IdeaFeedbackActionKind = "edit-difference" | "read-custom" | "reinvite";

export interface IdeaFeedbackAction {
  kind: IdeaFeedbackActionKind;
  label: string;
}

/** 친구가 보낸 자유 문장을 버리지 않고, 세 가지 고정 반응만 안전하게 집계한다. */
export function summarizeIdeaFeedback(messages: readonly string[]): IdeaFeedbackSummary {
  return messages.reduce<IdeaFeedbackSummary>((summary, message) => {
    summary.total += 1;
    if (message === IDEA_FEEDBACK_MESSAGES.understood) summary.understood += 1;
    else if (message === IDEA_FEEDBACK_MESSAGES.wantToUse) summary.wantToUse += 1;
    else if (message === IDEA_FEEDBACK_MESSAGES.needsDifference) summary.needsDifference += 1;
    else summary.custom += 1;
    return summary;
  }, { total: 0, understood: 0, wantToUse: 0, needsDifference: 0, custom: 0 });
}

/** 실제로 도착한 신호만 다음 행동으로 바꾼다. 반응이 없으면 빈 배열을 반환한다. */
export function nextIdeaFeedbackActions(summary: IdeaFeedbackSummary): IdeaFeedbackAction[] {
  if (summary.total === 0) return [];

  const actions: IdeaFeedbackAction[] = [];
  if (summary.needsDifference > 0) {
    actions.push({ kind: "edit-difference", label: "차별점 문장 고치기" });
  }
  if (summary.custom > 0) {
    actions.push({ kind: "read-custom", label: `친구가 직접 쓴 의견 ${summary.custom}개 읽기` });
  }
  if (actions.length === 0) {
    actions.push({ kind: "reinvite", label: "친구 한 명 더 초대하기" });
  }
  return actions;
}
