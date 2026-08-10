"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  ExternalLink,
  Inbox,
  Loader2,
  LogOut,
  MapPin,
  MessageSquareText,
  PanelRight,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/backend/auth";
import {
  createMatpinAdminActionIntent,
  persistMatpinAdminActionKeys,
  readMatpinAdminActionKeys,
} from "@/lib/matpin/admin-action-keys";
import { signInWithMatpinAdminGoogle } from "@/lib/matpin/admin-client-auth";
import type {
  MatpinAdminConversation,
  MatpinAdminConversationDetail,
  MatpinAdminFilter,
  MatpinAdminLiveSummary,
  MatpinAdminRange,
  MatpinAdminStoredMessage,
  MatpinAdminSummary,
} from "@/lib/matpin/admin-contract";
import {
  MATPIN_INSTAGRAM_TEXT_MAX_BYTES,
  matpinInstagramTextBytes,
} from "@/lib/matpin/message-limits";
import styles from "./matpin-admin.module.css";

type AccessState = "authorized" | "unauthenticated" | "forbidden" | "not_configured";

const FILTERS: Array<{ value: MatpinAdminFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "attention", label: "답장 필요" },
  { value: "processing", label: "처리 중" },
  { value: "saved", label: "저장 완료" },
  { value: "failed", label: "실패" },
];

const RANGES: Array<{ value: MatpinAdminRange; label: string }> = [
  { value: "24h", label: "24시간" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "all", label: "전체" },
];

const STATUS_LABEL: Record<MatpinAdminStoredMessage["status"], string> = {
  received: "접수됨",
  processing: "처리 중",
  needs_confirmation: "확인 필요",
  saved: "저장 완료",
  failed: "실패",
  deleted: "삭제됨",
};

function formatRelative(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1_000));
  if (seconds < 60) return "방금";
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}시간 전`;
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "확인 안 됨";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function publicError(code: string | null) {
  const messages: Record<string, string> = {
    unauthenticated: "로그인 세션이 만료됐습니다. 다시 로그인해주세요.",
    forbidden: "이 계정은 맛핀 운영 권한이 없습니다.",
    admin_reply_window_closed: "마지막 사용자 메시지로부터 24시간이 되어 답장할 수 없습니다.",
    admin_action_in_progress: "같은 작업을 처리하고 있습니다. 잠시 뒤 새로고침해주세요.",
    admin_action_completion_uncertain: "발송 여부를 자동으로 확인할 수 없습니다. 중복 발송을 막기 위해 대화에서 실제 전송 여부를 먼저 확인해주세요.",
    admin_action_already_failed: "이 요청은 이미 실패했습니다. 다시 시도해주세요.",
    admin_action_idempotency_mismatch: "요청 내용이 달라 안전하게 중단했습니다. 다시 시도해주세요.",
    admin_reprocess_unavailable: "실패한 게시물만 다시 처리할 수 있습니다.",
    admin_reprocess_recipient_mismatch: "선택한 대화와 처리 대상이 달라 중단했습니다. 대화를 새로고침해주세요.",
    admin_reply_recipient_mismatch: "선택한 대화와 수신자가 달라 중단했습니다. 대화를 새로고침해주세요.",
    admin_resend_unavailable: "저장된 장소가 있어야 보관함 링크를 보낼 수 있습니다.",
    admin_resend_recipient_mismatch: "선택한 대화와 전송 대상이 달라 중단했습니다. 대화를 새로고침해주세요.",
    meta_admin_fetch_failed: "Instagram 대화를 불러오지 못했습니다. 잠시 뒤 다시 시도해주세요.",
    meta_send_failed: "Instagram으로 메시지를 보내지 못했습니다. 잠시 뒤 다시 시도해주세요.",
    meta_send_not_configured: "Instagram 전송 설정이 없어 메시지를 보낼 수 없습니다.",
    invalid_message: "답장은 비어 있지 않은 1,000바이트 이하 문구여야 합니다.",
  };
  return messages[code ?? ""] ?? "요청을 완료하지 못했습니다. 다시 시도해주세요.";
}

async function fetchAdmin<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? `request_failed_${response.status}`);
  return body as T;
}

function AccessGate({ state, email }: { state: Exclude<AccessState, "authorized">; email: string | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = async () => {
    setPending(true);
    setError(null);
    const result = await signInWithMatpinAdminGoogle();
    if (result.error) {
      setError("Google 로그인을 시작하지 못했습니다. Supabase Auth 설정을 확인해주세요.");
      setPending(false);
    }
  };
  const logout = async () => {
    await signOut();
    window.location.assign("/matpin/admin");
  };
  const content = state === "not_configured"
    ? {
      title: "관리자 접근이 잠겨 있습니다",
      description: "MATPIN_ADMIN_EMAILS 허용목록이 설정되지 않았습니다. 환경 변수에 승인된 Google 이메일을 등록해주세요.",
    }
    : state === "forbidden"
      ? {
        title: "접근 권한이 없습니다",
        description: `${email ?? "현재 Google 계정"}은 맛핀 운영자 허용목록에 없습니다.`,
      }
      : {
        title: "맛핀 운영 CRM",
        description: "승인된 Google 계정으로 로그인하면 최근 Instagram 대화와 처리 상태를 확인할 수 있어요.",
      };
  return (
    <main className={styles.gate}>
      <section className={styles.gateCard} aria-labelledby="admin-gate-title">
        <div className={styles.brandMark}><MapPin size={22} aria-hidden="true" /></div>
        <p className={styles.eyebrow}>MATPIN OPERATIONS</p>
        <h1 id="admin-gate-title">{content.title}</h1>
        <p>{content.description}</p>
        {error ? <div className={styles.inlineError} role="alert"><AlertCircle size={17} />{error}</div> : null}
        {state === "unauthenticated" ? (
          <button className={styles.primaryButton} type="button" onClick={login} disabled={pending}>
            {pending ? <Loader2 className={styles.spin} size={18} /> : <ShieldCheck size={18} />}
            Google 계정으로 로그인
          </button>
        ) : null}
        {state === "forbidden" ? (
          <button className={styles.secondaryButton} type="button" onClick={logout}>
            <LogOut size={18} /> 다른 계정으로 로그인
          </button>
        ) : null}
        <p className={styles.gateNote}>데모 로그인은 제공하지 않으며, 허용목록이 비어 있으면 모든 접근을 거부합니다.</p>
      </section>
    </main>
  );
}

function StatusBadge({ message }: { message: MatpinAdminStoredMessage | null }) {
  if (!message) return <span className={`${styles.badge} ${styles.badgeNeutral}`}>미처리 메시지</span>;
  return <span className={`${styles.badge} ${styles[`badge_${message.status}`]}`}>{STATUS_LABEL[message.status]}</span>;
}

function ConversationLabel({ conversation }: { conversation: MatpinAdminConversation }) {
  return conversation.profile.name
    || (conversation.profile.username ? `@${conversation.profile.username}` : null)
    || "Instagram 사용자";
}

function SummaryBar({ summary, loading, failed, range, onRange }: {
  summary: MatpinAdminSummary | null;
  loading: boolean;
  failed: boolean;
  range: MatpinAdminRange;
  onRange: (value: MatpinAdminRange) => void;
}) {
  const metrics = [
    ["최근 대화", summary?.recentConversations, Inbox],
    ["답장 필요", summary?.replyNeeded, MessageSquareText],
    ["처리 중", summary?.processing, Clock3],
    ["실패", summary?.failed, AlertCircle],
    ["저장 장소", summary?.savedPlaces, MapPin],
    ["캐시 적중", summary ? `${summary.cacheHits}/${summary.cacheEntries}` : null, Database],
    ["API 요청", summary?.apiRequests, CircleDot],
    ["토큰", summary?.totalTokens, CircleDot],
  ] as const;
  return (
    <section className={styles.summary} aria-label="운영 지표" aria-busy={loading}>
      <div className={styles.summaryHeading}>
        <div>
          <span
            className={`${styles.liveDot} ${loading ? styles.liveDotLoading : failed || !summary?.instagramAvailable ? styles.liveDotOffline : ""}`}
            aria-hidden="true"
          />
          <strong>{loading ? "지표 불러오는 중" : failed ? "지표 조회 실패" : summary?.instagramAvailable ? "Instagram 실시간" : "DB 지표만 표시"}</strong>
        </div>
        <select aria-label="지표 기간" value={range} onChange={(event) => onRange(event.target.value as MatpinAdminRange)}>
          {RANGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className={styles.metrics}>
        {metrics.map(([label, value, Icon]) => (
          <div className={styles.metric} key={label}>
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
            <strong>{value === null || value === undefined ? "-" : typeof value === "number" ? value.toLocaleString("ko-KR") : value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MatpinAdmin({ accessState, email }: { accessState: AccessState; email: string | null }) {
  if (accessState !== "authorized") return <AccessGate state={accessState} email={email} />;
  return <AuthorizedAdmin email={email} />;
}

function AuthorizedAdmin({ email }: { email: string | null }) {
  const [range, setRange] = useState<MatpinAdminRange>("24h");
  const [filter, setFilter] = useState<MatpinAdminFilter>("all");
  const [summary, setSummary] = useState<MatpinAdminSummary | null>(null);
  const [liveSummary, setLiveSummary] = useState<MatpinAdminLiveSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [conversations, setConversations] = useState<MatpinAdminConversation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MatpinAdminConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [contextOpen, setContextOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mobileBackRef = useRef<HTMLButtonElement>(null);
  const summaryRequestRef = useRef(0);
  const conversationRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const actionLockRef = useRef(false);
  const actionKeysRef = useRef(new Map<string, string>());

  const loadSummary = useCallback(async () => {
    const requestId = ++summaryRequestRef.current;
    setSummaryLoading(true);
    setSummaryFailed(false);
    setSummary(null);
    try {
      const nextSummary = await fetchAdmin<MatpinAdminSummary>(`/api/matpin/admin/summary?range=${range}&instagram=0`);
      if (summaryRequestRef.current === requestId) setSummary(nextSummary);
    } catch (caught) {
      if (summaryRequestRef.current === requestId) {
        setSummaryFailed(true);
        setError(publicError(caught instanceof Error ? caught.message : null));
      }
    } finally {
      if (summaryRequestRef.current === requestId) setSummaryLoading(false);
    }
  }, [range]);

  const loadConversations = useCallback(async (after: string | null = null) => {
    const requestId = ++conversationRequestRef.current;
    if (after) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchAdmin<{
        conversations: MatpinAdminConversation[];
        partial: boolean;
        nextCursor: string | null;
        liveSummary: MatpinAdminLiveSummary;
      }>(
        `/api/matpin/admin/conversations?filter=${filter}${after ? `&after=${encodeURIComponent(after)}` : ""}`,
      );
      if (conversationRequestRef.current === requestId) {
        setConversations((current) => after
          ? [...new Map([...current, ...result.conversations].map((item) => [item.id, item])).values()]
          : result.conversations);
        setPartial(result.partial);
        if (!after) setLiveSummary(result.liveSummary);
        setNextCursor(result.nextCursor);
        if (!after) {
          setSelectedId((current) => result.conversations.some((item) => item.id === current)
            ? current
            : result.conversations[0]?.id ?? null);
        }
      }
    } catch (caught) {
      if (conversationRequestRef.current === requestId) {
        setError(`${publicError(caught instanceof Error ? caught.message : null)} 이전에 불러온 목록은 그대로 유지합니다.`);
      }
    } finally {
      if (conversationRequestRef.current === requestId) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filter]);

  const loadDetail = useCallback(async (id: string) => {
    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const nextDetail = await fetchAdmin<MatpinAdminConversationDetail>(`/api/matpin/admin/conversations/${encodeURIComponent(id)}`);
      if (detailRequestRef.current === requestId && nextDetail.id === id) setDetail(nextDetail);
    } catch (caught) {
      if (detailRequestRef.current === requestId) {
        setDetailError(publicError(caught instanceof Error ? caught.message : null));
      }
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  }, []);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => {
    actionKeysRef.current = readMatpinAdminActionKeys();
  }, []);
  useEffect(() => {
    setConversations([]);
    setNextCursor(null);
    setSelectedId(null);
    void loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
      return;
    }
    detailRequestRef.current += 1;
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
    setMobileView("list");
  }, [selectedId, loadDetail]);

  const refresh = async () => Promise.all([
    loadSummary(),
    loadConversations(),
    selectedId ? loadDetail(selectedId) : Promise.resolve(),
  ]);
  const selectConversation = (id: string) => {
    if (id !== selectedId) {
      setComposerOpen(false);
      setDraft("");
      setActionError(null);
    }
    setSelectedId(id);
    setMobileView("detail");
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => mobileBackRef.current?.focus());
    }
  };
  const returnToList = () => {
    setMobileView("list");
    window.requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`button[data-conversation="${CSS.escape(selectedId ?? "")}"]`)
        ?.focus();
    });
  };
  const selected = conversations.find((item) => item.id === selectedId) ?? null;
  const displayedSummary = summary && liveSummary ? { ...summary, ...liveSummary } : summary;
  const activeDetail = detail?.id === selectedId ? detail : null;
  const latestInbound = activeDetail?.messages.filter((message) => message.direction === "inbound").at(-1) ?? null;
  const actionMessage = activeDetail?.storedMessages[0] ?? null;
  const failedMessage = activeDetail?.storedMessages.find((message) => message.status === "failed") ?? null;
  const resendMessage = activeDetail?.storedMessages.find((message) => message.status === "saved" && message.savedPlaceCount > 0) ?? null;
  const draftBytes = matpinInstagramTextBytes(draft.trim());

  const runAction = async (
    key: string,
    url: string,
    body: Record<string, unknown> = {},
    surface: "global" | "dialog" = "global",
  ) => {
    if (actionLockRef.current) return false;
    actionLockRef.current = true;
    const intent = await createMatpinAdminActionIntent(key, url, body);
    const idempotencyKey = actionKeysRef.current.get(intent) ?? crypto.randomUUID();
    actionKeysRef.current.set(intent, idempotencyKey);
    persistMatpinAdminActionKeys(actionKeysRef.current);
    setActionPending(key);
    if (surface === "dialog") setActionError(null);
    else setError(null);
    try {
      await fetchAdmin(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, idempotencyKey }),
      });
      actionKeysRef.current.delete(intent);
      persistMatpinAdminActionKeys(actionKeysRef.current);
      await refresh();
      return true;
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : null;
      const shouldKeepKey = caught instanceof TypeError
        || code === "admin_action_in_progress"
        || code === "admin_action_completion_uncertain"
        || code?.startsWith("request_failed_5") === true
        || code === "unknown_error";
      if (!shouldKeepKey) {
        actionKeysRef.current.delete(intent);
        persistMatpinAdminActionKeys(actionKeysRef.current);
      }
      const message = publicError(code);
      if (surface === "dialog") setActionError(message);
      else setError(message);
      return false;
    } finally {
      actionLockRef.current = false;
      setActionPending(null);
    }
  };

  const sendReply = async () => {
    if (!selectedId || !activeDetail || !activeDetail.canReply || !draft.trim()) return;
    const sent = await runAction("reply", `/api/matpin/admin/conversations/${encodeURIComponent(selectedId)}/messages`, {
      text: draft.trim(),
    }, "dialog");
    if (sent) {
      setDraft("");
      setActionError(null);
      setComposerOpen(false);
    }
  };

  const confirmReprocess = () => {
    if (!failedMessage || !selectedId || !activeDetail) return;
    const target = ConversationLabel({ conversation: activeDetail });
    const reason = failedMessage.failureReason ? `\n실패 원인: ${failedMessage.failureReason}` : "";
    if (!window.confirm(`${target}님의 실패 게시물 1건을 다시 처리할까요?${reason}\n저장 분석만 다시 진행하며 자동 DM은 보내지 않습니다.`)) return;
    setContextOpen(false);
    void runAction("reprocess", `/api/matpin/admin/messages/${failedMessage.id}/reprocess`, {
      conversationId: selectedId,
    });
  };

  const confirmResend = () => {
    if (!resendMessage || !selectedId || !activeDetail?.canReply) return;
    if (!window.confirm(`${ConversationLabel({ conversation: activeDetail })}님에게 보관함 링크를 다시 보낼까요?`)) return;
    setContextOpen(false);
    void runAction("resend", `/api/matpin/admin/messages/${resendMessage.id}/resend`, {
      conversationId: selectedId,
    });
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const current = conversations.findIndex((item) => item.id === selectedId);
    const next = Math.min(conversations.length - 1, Math.max(0, current + (event.key === "ArrowDown" ? 1 : -1)));
    const conversation = conversations[next];
    if (conversation) {
      setSelectedId(conversation.id);
      listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-conversation]")[next]?.focus();
    }
  };

  const logout = async () => {
    await signOut();
    window.location.assign("/matpin/admin");
  };

  return (
    <main className={styles.adminShell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}><MapPin size={18} /></span>
          <div><strong>맛핀 운영 CRM</strong><span>Instagram 대화와 저장 처리</span></div>
        </div>
        <div className={styles.topActions}>
          <span className={styles.adminEmail}>{email}</span>
          <button type="button" className={styles.iconButton} onClick={() => void refresh()} aria-label="새로고침">
            <RefreshCw size={18} />
          </button>
          <button type="button" className={styles.iconButton} onClick={logout} aria-label="로그아웃">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <SummaryBar summary={displayedSummary} loading={summaryLoading} failed={summaryFailed} range={range} onRange={setRange} />
      {error ? (
        <div className={styles.globalError} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} aria-label="다시 시도"><RefreshCw size={17} /></button>
          <button type="button" onClick={() => setError(null)} aria-label="오류 닫기"><X size={17} /></button>
        </div>
      ) : null}
      {partial && !error ? <div className={styles.partialNotice} role="status"><AlertCircle size={16} />일부 Instagram 대화는 불러오지 못했습니다. 표시된 대화는 정상적으로 사용할 수 있어요.</div> : null}

      <div className={`${styles.workspace} ${mobileView === "detail" ? styles.showDetail : styles.showList}`}>
        <section className={styles.conversationList} aria-label="대화 목록">
          <div className={styles.panelHeader}>
            <div><h1>대화</h1><span>{conversations.length}명</span></div>
            <p>Instagram에서 최근 메시지를 실시간으로 불러옵니다.</p>
          </div>
          <div className={styles.filters} aria-label="대화 상태 필터">
            {FILTERS.map((item) => (
              <button key={item.value} className={filter === item.value ? styles.activeFilter : ""} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.listBody} ref={listRef} onKeyDown={onListKeyDown} aria-busy={loading || loadingMore}>
            {loading ? <Loading label="대화를 불러오는 중" /> : null}
            {!loading && conversations.length === 0 ? (
              <Empty icon={<Inbox size={24} />} title="표시할 대화가 없습니다" description="필터를 바꾸거나 잠시 뒤 새로고침해주세요." />
            ) : null}
            {!loading ? conversations.map((conversation) => (
              <button
                data-conversation={conversation.id}
                key={conversation.id}
                type="button"
                className={`${styles.conversationRow} ${selectedId === conversation.id ? styles.selectedRow : ""}`}
                onClick={() => selectConversation(conversation.id)}
                aria-current={selectedId === conversation.id ? "true" : undefined}
              >
                <span className={styles.avatar} aria-hidden="true">{ConversationLabel({ conversation }).replace("@", "").slice(0, 1)}</span>
                <span className={styles.rowContent}>
                  <span className={styles.rowTop}><strong>{ConversationLabel({ conversation })}</strong><time>{formatRelative(conversation.updatedAt)}</time></span>
                  <span className={styles.rowPreview}>{conversation.latestMessage?.text ?? (conversation.latestMessage?.attachmentKind ? "게시물을 공유했습니다" : "메시지 없음")}</span>
                  <span className={styles.rowMeta}>
                    <StatusBadge message={conversation.latestStoredMessage} />
                    {conversation.failedMessageCount > 0 ? <span>실패 {conversation.failedMessageCount}건</span> : null}
                    {conversation.savedPlaceCount > 0 ? <span>{conversation.savedPlaceCount}곳</span> : null}
                  </span>
                </span>
                {conversation.needsReply ? <span className={styles.unreadDot} aria-label="답장 필요" /> : <ChevronRight size={16} aria-hidden="true" />}
              </button>
            )) : null}
            {!loading && nextCursor ? (
              <div className={styles.loadMore}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void loadConversations(nextCursor)}
                >
                  {loadingMore ? <Loader2 className={styles.spin} size={17} /> : <ChevronRight size={17} />}
                  대화 더 보기
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.conversationPanel} aria-label="선택한 대화">
          {selected ? (
            <>
              <div className={styles.conversationHeader}>
                <button ref={mobileBackRef} className={styles.mobileBack} type="button" onClick={returnToList} aria-label="대화 목록으로 돌아가기"><ArrowLeft size={20} /></button>
                <div><strong>{ConversationLabel({ conversation: selected })}</strong><span>{selected.profile.username ? `@${selected.profile.username}` : "사용자명 확인 안 됨"}</span></div>
                <button className={styles.contextButton} type="button" aria-label="사용자 정보 열기" onClick={() => setContextOpen(true)}><PanelRight size={18} /><span>사용자 정보</span></button>
              </div>
              <div className={styles.messageNotice}><ShieldCheck size={15} />최근 메시지 20건만 표시합니다. 원문은 맛핀 DB에 저장하지 않아요.</div>
              <div className={styles.messageStream} aria-live="polite">
                {detailLoading ? <Loading label="메시지를 불러오는 중" /> : null}
                {!detailLoading && detailError ? <RetryState message={detailError} onRetry={() => selectedId && void loadDetail(selectedId)} /> : null}
                {!detailLoading && !detailError && activeDetail?.messages.length === 0 ? <Empty icon={<MessageSquareText size={24} />} title="메시지가 없습니다" description="Instagram에서 최근 메시지를 찾지 못했습니다." /> : null}
                {!detailLoading && !detailError ? activeDetail?.messages.map((message) => (
                  <article key={message.id} className={`${styles.messageBubble} ${message.direction === "outbound" ? styles.outbound : styles.inbound}`}>
                    <span>{message.direction === "outbound" ? "맛핀" : ConversationLabel({ conversation: selected })}</span>
                    {message.text ? <p>{message.text}</p> : null}
                    {message.attachmentKind ? <div className={styles.attachment}><ExternalLink size={15} />{message.attachmentKind === "share" ? "공유 게시물" : `${message.attachmentKind} 첨부`}</div> : null}
                    <time>{formatDateTime(message.createdAt)}</time>
                  </article>
                )) : null}
              </div>
              <div className={styles.composerBar}>
                <div>
                  <strong>{activeDetail?.canReply ? "개별 답장을 보낼 수 있습니다" : "자유 문구 답장이 닫혔습니다"}</strong>
                  <span>{activeDetail?.canReply ? `답장 가능 시각 ${formatDateTime(activeDetail.replyWindowEndsAt)}까지` : "마지막 수신 후 24시간이 지난 대화입니다."}</span>
                </div>
                <button className={styles.primaryButton} type="button" disabled={!activeDetail?.canReply} onClick={() => {
                  setDraft("");
                  setActionError(null);
                  setComposerOpen(true);
                }}><Send size={17} />답장 작성</button>
              </div>
            </>
          ) : <Empty icon={<MessageSquareText size={26} />} title="대화를 선택해주세요" description="왼쪽 목록에서 확인할 대화를 선택하면 메시지와 처리 상태를 볼 수 있습니다." />}
        </section>

        <aside className={styles.contextPanel} aria-label="사용자 맥락">
          <div className={styles.contextHeader}>
            <div><h2>사용자 맥락</h2><span>실시간 프로필과 맛핀 처리 기록</span></div>
          </div>
          <ContextContents
            detail={activeDetail}
            loading={detailLoading}
            error={detailError}
            actionMessage={actionMessage}
            failedMessage={failedMessage}
            resendMessage={resendMessage}
            actionPending={actionPending}
            onRetry={() => selectedId && void loadDetail(selectedId)}
            onReprocess={confirmReprocess}
            onResend={confirmResend}
          />
        </aside>
      </div>

      <Dialog.Root open={contextOpen} onOpenChange={setContextOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.contextOverlay} />
          <Dialog.Content className={styles.contextDrawer} aria-describedby="context-description">
            <div className={styles.contextHeader}>
              <div>
                <Dialog.Title asChild><h2>사용자 맥락</h2></Dialog.Title>
                <Dialog.Description id="context-description">실시간 프로필과 맛핀 처리 기록</Dialog.Description>
              </div>
              <Dialog.Close type="button" aria-label="사용자 정보 닫기"><X size={19} /></Dialog.Close>
            </div>
            <ContextContents
              detail={activeDetail}
              loading={detailLoading}
              error={detailError}
              actionMessage={actionMessage}
              failedMessage={failedMessage}
              resendMessage={resendMessage}
              actionPending={actionPending}
              onRetry={() => selectedId && void loadDetail(selectedId)}
              onReprocess={confirmReprocess}
              onResend={confirmResend}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={composerOpen} onOpenChange={(open) => {
        if (!actionPending) {
          setComposerOpen(open);
          if (!open) {
            setDraft("");
            setActionError(null);
          }
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent} aria-describedby="reply-description">
            <div className={styles.dialogHeader}>
              <div><Dialog.Title>개별 답장 확인</Dialog.Title><Dialog.Description id="reply-description">수신자와 최종 문구를 확인한 뒤 한 번만 발송합니다.</Dialog.Description></div>
              <Dialog.Close className={styles.iconButton} aria-label="답장 창 닫기"><X size={18} /></Dialog.Close>
            </div>
            <div className={styles.recipientCheck}><Check size={18} /><div><span>수신자</span><strong>{selected ? ConversationLabel({ conversation: selected }) : "확인 안 됨"}</strong></div></div>
            <div className={styles.latestInbound}><span>최근 사용자 메시지</span><p>{latestInbound?.text ?? (latestInbound?.attachmentKind ? "공유 게시물" : "내용 없음")}</p></div>
            {actionError ? <div className={styles.dialogError} role="alert"><AlertCircle size={17} />{actionError}</div> : null}
            <label className={styles.composerLabel}>
              <span>보낼 문구</span>
              <textarea
                value={draft}
                maxLength={1_000}
                rows={7}
                autoFocus
                aria-describedby="reply-byte-count"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="사용자 상황에 맞는 답장을 입력해주세요."
              />
              <small id="reply-byte-count" className={draftBytes > MATPIN_INSTAGRAM_TEXT_MAX_BYTES ? styles.byteLimitExceeded : undefined}>
                {draftBytes.toLocaleString("ko-KR")}/1,000바이트
              </small>
            </label>
            <div className={styles.dialogActions}>
              <Dialog.Close className={styles.secondaryButton}>취소</Dialog.Close>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!draft.trim() || draftBytes > MATPIN_INSTAGRAM_TEXT_MAX_BYTES || Boolean(actionPending)}
                onClick={() => void sendReply()}
              >
                {actionPending === "reply" ? <Loader2 className={styles.spin} size={17} /> : <Send size={17} />}확인하고 보내기
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

function Loading({ label }: { label: string }) {
  return <div className={styles.loading} role="status"><Loader2 className={styles.spin} size={20} /><span>{label}</span></div>;
}

function Empty({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className={styles.empty}>{icon}<strong>{title}</strong><p>{description}</p></div>;
}

function RetryState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.empty} role="alert">
      <AlertCircle size={24} />
      <strong>정보를 불러오지 못했습니다</strong>
      <p>{message}</p>
      <button className={styles.secondaryButton} type="button" onClick={onRetry}><RefreshCw size={16} />다시 시도</button>
    </div>
  );
}

function ContextContents({
  detail,
  loading,
  error,
  actionMessage,
  failedMessage,
  resendMessage,
  actionPending,
  onRetry,
  onReprocess,
  onResend,
}: {
  detail: MatpinAdminConversationDetail | null;
  loading: boolean;
  error: string | null;
  actionMessage: MatpinAdminStoredMessage | null;
  failedMessage: MatpinAdminStoredMessage | null;
  resendMessage: MatpinAdminStoredMessage | null;
  actionPending: string | null;
  onRetry: () => void;
  onReprocess: () => void;
  onResend: () => void;
}) {
  if (loading) return <Loading label="사용자 맥락을 불러오는 중" />;
  if (error) return <RetryState message={error} onRetry={onRetry} />;
  if (!detail) {
    return <Empty icon={<PanelRight size={24} />} title="사용자 정보 없음" description="대화를 선택하면 처리 맥락이 표시됩니다." />;
  }

  return (
    <div className={styles.contextBody}>
      <section className={styles.profileCard}>
        <span className={styles.largeAvatar}>{ConversationLabel({ conversation: detail }).replace("@", "").slice(0, 1)}</span>
        <div>
          <strong>{ConversationLabel({ conversation: detail })}</strong>
          <span>{detail.profile.username ? `@${detail.profile.username}` : "사용자명 없음"}</span>
        </div>
      </section>
      <ContextSection title="최근 처리">
        {actionMessage ? (
          <div className={styles.processingCard}>
            <div><StatusBadge message={actionMessage} /><time>{formatDateTime(actionMessage.receivedAt)}</time></div>
            <dl>
              <div><dt>분석 시간</dt><dd>{actionMessage.analysisDurationMs === null ? "-" : `${(actionMessage.analysisDurationMs / 1_000).toFixed(1)}초`}</dd></div>
              <div><dt>토큰</dt><dd>{actionMessage.totalTokens?.toLocaleString("ko-KR") ?? "-"}</dd></div>
              <div><dt>시도</dt><dd>{actionMessage.attemptCount}회</dd></div>
            </dl>
            {actionMessage.failureReason ? <p className={styles.failureReason}><AlertCircle size={15} />{actionMessage.failureReason}</p> : null}
            {failedMessage ? (
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={Boolean(actionPending)}
                onClick={onReprocess}
              >
                {actionPending === "reprocess" ? <Loader2 className={styles.spin} size={17} /> : <RotateCcw size={17} />}
                {detail.failedMessageCount > 1 ? `실패 ${detail.failedMessageCount}건 중 최근 1건 다시 처리` : "실패 건 다시 처리"}
              </button>
            ) : null}
          </div>
        ) : <p className={styles.mutedText}>맛핀 처리 기록이 없습니다.</p>}
      </ContextSection>
      <ContextSection title={`저장 장소 ${detail.savedPlaces.length}곳`}>
        {detail.savedPlaces.slice(0, 8).map((place) => (
          <div className={styles.placeRow} key={place.id}>
            <MapPin size={16} />
            <div><strong>{place.name}</strong><span>{place.stationName || place.address || "위치 정보 없음"}</span></div>
          </div>
        ))}
        {detail.savedPlaces.length === 0 ? <p className={styles.mutedText}>저장된 장소가 없습니다.</p> : null}
        {resendMessage ? (
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={Boolean(actionPending) || !detail.canReply}
            title={detail.canReply ? undefined : "마지막 수신 후 24시간이 되어 링크를 보낼 수 없습니다."}
            onClick={onResend}
          >
            {actionPending === "resend" ? <Loader2 className={styles.spin} size={17} /> : <Send size={17} />}보관함 링크 재전송
          </button>
        ) : null}
      </ContextSection>
    </div>
  );
}

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.contextSection}><h3>{title}</h3>{children}</section>;
}
