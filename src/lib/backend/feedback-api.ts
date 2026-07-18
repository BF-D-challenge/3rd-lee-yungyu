import {
  isFeedbackOwnerAccess,
  isFeedbackWriteAccess,
  type FeedbackChannel,
  type FeedbackOwnerAccess,
  type FeedbackWriteAccess,
} from "../feedback-access";
import type { DuelPraiseId, DuelSide, DuelVotes, Vote, VoteType } from "../storage";
import { getSupabase } from "./client";

const FUNCTION_NAME = "feedback-api";

type RemoteResult<T> =
  | { status: "ok"; data: T }
  | { status: "disabled" }
  | { status: "failed" };

const invoke = async <T>(body: Record<string, unknown>): Promise<RemoteResult<T>> => {
  const client = getSupabase();
  if (!client) return { status: "disabled" };
  try {
    const { data, error } = await client.functions.invoke(FUNCTION_NAME, { body });
    if (error || !data || data.ok !== true) return { status: "failed" };
    return { status: "ok", data: data as T };
  } catch {
    return { status: "failed" };
  }
};

export const feedbackApiConfigured = (): boolean => {
  try {
    return Boolean(getSupabase());
  } catch {
    return false;
  }
};

export async function registerFeedbackRequest(
  channel: FeedbackChannel,
  access: FeedbackOwnerAccess,
): Promise<"registered" | "local-only" | "failed"> {
  if (!isFeedbackOwnerAccess(access)) return "failed";
  const result = await invoke<{ ok: true }>({
    action: "register",
    channel,
    requestId: access.requestId,
    writeToken: access.writeToken,
    readToken: access.readToken,
  });
  if (result.status === "disabled") return "local-only";
  return result.status === "ok" ? "registered" : "failed";
}

export async function sendCardVote(input: {
  access: FeedbackWriteAccess;
  voterToken: string;
  kind: VoteType;
  comment?: string;
}): Promise<"synced" | "disabled" | "failed"> {
  if (!isFeedbackWriteAccess(input.access)) return "failed";
  const result = await invoke<{ ok: true }>({
    action: "cast",
    channel: "card",
    ...input.access,
    voterToken: input.voterToken,
    kind: input.kind,
    comment: input.comment,
  });
  return result.status === "ok" ? "synced" : result.status;
}

export async function updateCardComment(input: {
  access: FeedbackWriteAccess;
  voterToken: string;
  comment: string;
}): Promise<"synced" | "disabled" | "failed"> {
  if (!isFeedbackWriteAccess(input.access)) return "failed";
  const result = await invoke<{ ok: true }>({
    action: "comment",
    channel: "card",
    ...input.access,
    voterToken: input.voterToken,
    comment: input.comment,
  });
  return result.status === "ok" ? "synced" : result.status;
}

export async function readCardVotes(input: {
  requestId: string;
  readToken: string;
  excludeVoterToken?: string;
}): Promise<RemoteResult<{ ok: true; votes: Vote[] }>> {
  const result = await invoke<{ ok: true; votes: Vote[] }>({
    action: "read",
    channel: "card",
    requestId: input.requestId,
    readToken: input.readToken,
    excludeVoterToken: input.excludeVoterToken,
  });
  if (result.status !== "ok") return result;
  return {
    status: "ok",
    data: {
      ok: true,
      votes: Array.isArray(result.data.votes) ? result.data.votes : [],
    },
  };
}

export async function sendDuelVote(input: {
  access: FeedbackWriteAccess;
  voterToken: string;
  side: DuelSide;
  comment?: string;
  roundId?: string | null;
  userId?: string | null;
  candidateId?: string | null;
  praiseId?: DuelPraiseId | null;
  idempotencyKey?: string | null;
}): Promise<"synced" | "disabled" | "failed"> {
  if (!isFeedbackWriteAccess(input.access)) return "failed";
  const result = await invoke<{ ok: true }>({
    action: "cast",
    channel: "duel",
    ...input.access,
    voterToken: input.voterToken,
    side: input.side,
    comment: input.comment,
    roundId: input.roundId,
    userId: input.userId,
    candidateId: input.candidateId,
    praiseId: input.praiseId,
    idempotencyKey: input.idempotencyKey,
  });
  return result.status === "ok" ? "synced" : result.status;
}

export async function updateDuelComment(input: {
  access: FeedbackWriteAccess;
  voterToken: string;
  comment: string;
}): Promise<"synced" | "disabled" | "failed"> {
  if (!isFeedbackWriteAccess(input.access)) return "failed";
  const result = await invoke<{ ok: true }>({
    action: "comment",
    channel: "duel",
    ...input.access,
    voterToken: input.voterToken,
    comment: input.comment,
  });
  return result.status === "ok" ? "synced" : result.status;
}

export async function readDuelVotes(input: {
  requestId: string;
  readToken: string;
}): Promise<RemoteResult<{ ok: true; votes: DuelVotes }>> {
  const result = await invoke<{ ok: true; votes: DuelVotes }>({
    action: "read",
    channel: "duel",
    requestId: input.requestId,
    readToken: input.readToken,
  });
  if (result.status !== "ok") return result;
  const votes = result.data.votes;
  return {
    status: "ok",
    data: {
      ok: true,
      votes: votes && typeof votes.a === "number" && typeof votes.b === "number"
        ? votes
        : { a: 0, b: 0, comments: [] },
    },
  };
}
