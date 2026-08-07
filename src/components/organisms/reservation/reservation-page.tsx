"use client";

import {
  AtSign,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import {
  checkAuthSession,
  consumeAuthPending,
  reservationUsesSupabase,
  type AuthSession,
} from "@/lib/auth-session";
import type {
  FakeDoorProductConfig,
  FakeDoorReservation,
  FakeDoorSlot,
} from "@/lib/fake-door-reservation-contract";
import {
  clearPendingContactConsent,
  findFakeDoorReservation,
  loadPendingContactConsent,
  saveFakeDoorReservation,
  savePendingContactConsent,
  type PendingContactConsent,
} from "@/lib/fake-door-reservation-store";
import {
  trackMvpInstagramInputStarted,
  trackMvpLoginCompleted,
  trackMvpReservationCompleted,
} from "@/lib/mvp-experiment-analytics";
import {
  instagramHandleError,
  loadPendingInstagramHandle,
  normalizeInstagramHandle,
  savePendingInstagramHandle,
} from "@/lib/instagram-handle";
import { track } from "@/lib/track";
import styles from "./reservation-page.module.css";

interface ReservationPageProps {
  config: FakeDoorProductConfig;
}

export function ReservationPage({ config }: ReservationPageProps) {
  const instagramInputRef = useRef<HTMLInputElement>(null);
  const contactConsentRef = useRef<HTMLInputElement>(null);
  const instagramStartedRef = useRef(false);
  const [slot, setSlot] = useState<FakeDoorSlot>("this-week");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramError, setInstagramError] = useState("");
  const [contactConsent, setContactConsent] = useState<PendingContactConsent | null>(null);
  const [contactConsentError, setContactConsentError] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [reservation, setReservation] = useState<FakeDoorReservation | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"supabase" | "local_demo">(
    reservationUsesSupabase ? "supabase" : "local_demo",
  );

  const selectedSlot = useMemo(
    () => config.slots.find((option) => option.value === slot) ?? config.slots[0],
    [config.slots, slot],
  );
  const requiresInstagram = config.requiresInstagram;
  const isOnebite = config.product === "onebite";
  const instagramLabel = isOnebite
    ? "7일 패스 소식을 받을 Instagram 아이디"
    : "맛집 릴스를 보낼 Instagram 아이디";
  const instagramHelp = isOnebite
    ? "패스가 열리면 연결한 계정 기준으로 한 번 알려드려요. 아직 결제하지 않아요."
    : "예약 뒤 안내받은 방법으로 맛집 릴스를 보내면 내 맛집 저장함을 준비해드려요.";
  const reservationLabel = isOnebite ? "7일 패스 출시 알림" : "선공개 예약";
  const contactConsentLabel = isOnebite
    ? "Google 계정 이메일로 7일 패스 출시 안내를 받는 데 동의해요."
    : "Google 계정 이메일로 출시와 초기 체험 안내를 받는 데 동의해요.";
  const normalizedInstagram = normalizeInstagramHandle(instagramHandle);
  const instagramReady = !requiresInstagram || Boolean(normalizedInstagram);
  const loginReady = instagramReady && Boolean(contactConsent);
  const slotStepNumber = requiresInstagram ? 2 : 1;
  const authStepNumber = requiresInstagram ? 3 : 2;
  const saveStepNumber = requiresInstagram ? 4 : 3;

  useEffect(() => {
    let cancelled = false;
    if (requiresInstagram) setInstagramHandle(loadPendingInstagramHandle(config.product));
    setContactConsent(loadPendingContactConsent(config.product));
    track("fake_door_reservation_viewed", { product: config.product });
    void checkAuthSession({ requireSupabaseWhenConfigured: true })
      .then(async (nextSession) => {
        if (cancelled) return;
        setSession(nextSession);
        if (!nextSession) return;
        setMode(nextSession.demo ? "local_demo" : "supabase");
        if (consumeAuthPending("creator")) {
          track("fake_door_reservation_login_completed", {
            product: config.product,
            method: nextSession.demo ? "demo" : "google",
          }, { meta: false });
          trackMvpLoginCompleted(config.product, nextSession);
        }
        const existing = await findFakeDoorReservation(nextSession, config.product);
        if (cancelled || !existing) return;
        setReservation(existing);
        setSlot(existing.slot_key);
        if (existing.instagram_handle) {
          setInstagramHandle(existing.instagram_handle);
        }
      })
      .catch(() => {
        if (!cancelled) setError("예약 상태를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => {
        if (!cancelled) setCheckingAuth(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.product, requiresInstagram]);

  const authenticated = (nextSession: AuthSession) => {
    setSession(nextSession);
    setMode(nextSession.demo ? "local_demo" : "supabase");
    setError("");
    track("fake_door_reservation_login_completed", {
      product: config.product,
      method: nextSession.demo ? "demo" : "google",
    }, { meta: false });
    trackMvpLoginCompleted(config.product, nextSession);
  };

  const reserve = async () => {
    if (!session || saving) return;
    if (requiresInstagram && !normalizedInstagram) {
      setInstagramError(instagramHandleError(instagramHandle));
      instagramInputRef.current?.focus();
      return;
    }
    if (!contactConsent) {
      setContactConsentError("출시와 초기 체험 안내를 위한 연락 동의가 필요해요.");
      contactConsentRef.current?.focus();
      return;
    }
    setSaving(true);
    setError("");
    if (!session.demo) {
      track("fake_door_reservation_submit", {
        product: config.product,
        slot_key: slot,
      });
    }
    try {
      const result = await saveFakeDoorReservation(session, {
        product: config.product,
        slotKey: slot,
        sourcePath: `${window.location.pathname}${window.location.search}`,
        instagramHandle: normalizedInstagram,
        contactConsent,
      });
      setReservation(result.reservation);
      setMode(result.mode);
      clearPendingContactConsent(config.product);
      if (result.mode === "supabase") {
        track("fake_door_reservation_completed", {
          product: config.product,
          slot_key: slot,
          storage_mode: result.mode,
          submit_success: true,
        }, { meta: false });
        trackMvpReservationCompleted(config.product, session, {
          slot_key: slot,
          storage_mode: result.mode,
          submit_success: true,
        });
      } else {
        track("fake_door_reservation_demo_saved", {
          product: config.product,
          slot_key: slot,
          storage_mode: result.mode,
        });
      }
    } catch {
      setError("예약을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const theme = {
    "--reservation-accent": config.accent,
    "--reservation-accent-strong": config.accentStrong,
    "--reservation-bg": config.background,
    "--reservation-surface": config.surface,
    "--reservation-ink": config.ink,
    "--reservation-muted": config.muted,
  } as CSSProperties;

  return (
    <main
      className={styles.page}
      data-dark={config.dark ? "true" : undefined}
      style={theme}
    >
      <header className={styles.header}>
        <strong>{config.name}</strong>
        <span>실제 체험 준비 중</span>
      </header>

      <div className={styles.layout}>
        <section className={styles.story} aria-labelledby="reservation-title">
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{config.eyebrow}</p>
            <h1 id="reservation-title">{config.headline}</h1>
            <p className={styles.description}>{config.description}</p>
            <p className={styles.releaseNotice} role="note">
              지금은 예약만 받아요 · 아직 결제하지 않아요.
            </p>
            <a className={styles.jumpToBooking} href="#reservation-form">
              예약 정보 입력하기
            </a>
          </div>

          <div className={styles.visual}>
            <span className={styles.visualLabel}>AI 제품 화면 시안</span>
            <Image
              src={config.image}
              alt={config.imageAlt}
              width={390}
              height={844}
              priority
              sizes="(max-width: 480px) calc(100vw - 3rem), 320px"
            />
          </div>

          <section className={styles.proof} aria-labelledby="reservation-proof-title">
            <p id="reservation-proof-title">{config.promise}</p>
            <ul>
              {config.proof.map((item) => (
                <li key={item}>
                  <Check aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section
          className={styles.booking}
          id="reservation-form"
          aria-labelledby="booking-title"
        >
          {reservation ? (
            <div className={styles.complete} role="status" tabIndex={-1}>
              <CheckCircle2 aria-hidden />
              <p>{mode === "local_demo" ? "데모 저장 완료" : "예약 신청 완료"}</p>
              <h2 id="booking-title">{selectedSlot.label}</h2>
              <span>{selectedSlot.description}</span>
              <dl>
                <div>
                  <dt>예약한 체험</dt>
                  <dd>{config.name}</dd>
                </div>
                <div>
                  <dt>현재 상태</dt>
                  <dd>{mode === "local_demo" ? "로컬 데모" : "체험 안내 대기"}</dd>
                </div>
                {reservation.instagram_handle ? (
                  <div>
                    <dt>연결한 Instagram</dt>
                    <dd data-clarity-mask="true">@{reservation.instagram_handle}</dd>
                  </div>
                ) : null}
              </dl>
              {mode === "local_demo" ? (
                <p className={styles.demoNotice}>
                  이것은 로컬 데모예요. 이 브라우저에만 저장되며 실제 예약이나 전환으로 집계되지 않아요.
                </p>
              ) : (
                <p className={styles.honestNotice}>
                  지금 결제되거나 체험 일정이 확정된 것은 아니에요. 실제 체험은 준비가 끝난 뒤 연결한 Google 계정으로 안내해드려요.
                </p>
              )}
              <p className={styles.closeNotice}>이 페이지를 닫아도 예약 신청은 저장돼요.</p>
            </div>
          ) : (
            <>
              {mode === "local_demo" ? (
                <p className={styles.demoBanner} role="note">
                  로컬 데모 모드 · 입력 내용은 이 브라우저에만 저장되며 실제 예약 전환으로 집계되지 않습니다.
                </p>
              ) : null}

              <div className={styles.bookingHeading}>
                <p>{reservationLabel}</p>
                <h2 id="booking-title">지금은 예약만 받아요.</h2>
                <span>{requiresInstagram ? "네" : "세"} 단계로 신청하면, 실제 체험이 준비됐을 때 안내해드려요. 아직 결제하지 않아요.</span>
              </div>

              {requiresInstagram ? (
                <div className={styles.instagramStep} data-reservation-step="instagram">
                  <div className={styles.stepLabel}>
                    <span>1</span>
                    <p>Instagram 아이디</p>
                  </div>
                  <label htmlFor="reservation-instagram">{instagramLabel}</label>
                  <div className={styles.instagramInput} data-error={instagramError ? "true" : undefined}>
                    <AtSign aria-hidden />
                    <input
                      ref={instagramInputRef}
                      id="reservation-instagram"
                      name="instagram"
                      type="text"
                      value={instagramHandle}
                      onChange={(event) => {
                        setInstagramHandle(event.target.value);
                        setInstagramError("");
                        savePendingInstagramHandle(event.target.value, config.product);
                        if (!instagramStartedRef.current) {
                          instagramStartedRef.current = true;
                          trackMvpInstagramInputStarted(config.product);
                        }
                      }}
                      onBlur={() => setInstagramError(instagramHandleError(instagramHandle))}
                      placeholder={isOnebite ? "my_daily_meal" : "my_food_archive"}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={31}
                      aria-describedby="reservation-instagram-help reservation-instagram-error"
                      aria-invalid={Boolean(instagramError)}
                      required
                      data-clarity-mask="true"
                    />
                  </div>
                  <p id="reservation-instagram-help">{instagramHelp}</p>
                  <p id="reservation-instagram-error" className={styles.fieldError} role="alert">
                    {instagramError}
                  </p>
                </div>
              ) : null}

              <div className={styles.slotStep} data-reservation-step="slot">
                <div className={styles.stepLabel}>
                  <span>{slotStepNumber}</span>
                  <p>희망 시점</p>
                </div>
                <fieldset className={styles.slots}>
                  <legend className="sr-only">실제 체험 희망 시기</legend>
                  {config.slots.map((option) => (
                    <label key={option.value} data-selected={slot === option.value ? "true" : undefined}>
                      <input
                        type="radio"
                        name="reservation-slot"
                        value={option.value}
                        checked={slot === option.value}
                        onChange={() => {
                          setSlot(option.value);
                          setError("");
                          track("fake_door_reservation_slot_selected", {
                            product: config.product,
                            slot_key: option.value,
                          });
                        }}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                      <Check aria-hidden />
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className={styles.authStep} data-reservation-step="auth">
                <div className={styles.stepLabel}>
                  <span>{authStepNumber}</span>
                  <p>Google 로그인</p>
                </div>
                <label className={styles.contactConsent}>
                  <input
                    ref={contactConsentRef}
                    type="checkbox"
                    checked={Boolean(contactConsent)}
                    onChange={(event) => {
                      setContactConsent(
                        savePendingContactConsent(config.product, event.target.checked),
                      );
                      setContactConsentError("");
                      setError("");
                    }}
                    aria-describedby="reservation-contact-consent-help reservation-contact-consent-error"
                    aria-invalid={Boolean(contactConsentError)}
                  />
                  <span>
                    {contactConsentLabel}
                  </span>
                </label>
                <p id="reservation-contact-consent-help" className={styles.contactConsentHelp}>
                  예약 안내에만 사용하고 광고 분석에는 보내지 않아요. 동의하지 않으면 예약을 저장하지 않습니다.
                </p>
                <p
                  id="reservation-contact-consent-error"
                  className={styles.fieldError}
                  role="alert"
                >
                  {contactConsentError}
                </p>
                {checkingAuth ? (
                  <p className={styles.loading} role="status">
                    <LoaderCircle aria-hidden />
                    계정 상태 확인 중
                  </p>
                ) : session ? (
                  <>
                    <p className={styles.accountReady}>
                      <ShieldCheck aria-hidden />
                      {session.demo
                        ? "로컬 데모 준비 완료"
                        : session.displayName
                          ? `${session.displayName}님 Google 계정 확인 완료`
                          : "Google 계정 확인 완료"}
                    </p>
                  </>
                ) : (
                  <GoogleLoginButton
                    context="creator"
                    label={reservationUsesSupabase ? "Google로 예약 계속하기" : "로컬 데모로 계속하기"}
                    disabled={!loginReady}
                    requireSupabaseWhenConfigured
                    returnTo={`/reserve/${config.product}`}
                    onAuthenticated={authenticated}
                    onBeforeAuth={() => {
                      if (!contactConsent) {
                        setContactConsentError("출시와 초기 체험 안내를 위한 연락 동의가 필요해요.");
                        contactConsentRef.current?.focus();
                        return;
                      }
                      track("fake_door_reservation_login_started", {
                        product: config.product,
                        slot_key: slot,
                      });
                    }}
                  />
                )}
              </div>

              {session ? (
                <div className={styles.saveStep} data-reservation-step="save">
                  <div className={styles.stepLabel}>
                    <span>{saveStepNumber}</span>
                    <p>{session.demo ? "데모 저장" : "예약 저장"}</p>
                  </div>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => void reserve()}
                    disabled={saving || !loginReady}
                  >
                    {saving ? (
                      <>
                        <LoaderCircle aria-hidden />
                        저장 중
                      </>
                    ) : (
                      <>
                        <Clock3 aria-hidden />
                        {session.demo ? `${selectedSlot.label} 데모 저장` : `${selectedSlot.label} 예약 신청`}
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              {requiresInstagram ? (
                <p className={styles.privacy}>
                  <ShieldCheck aria-hidden />
                  Instagram 아이디는 {isOnebite ? "7일 패스 출시 알림" : `${config.name} 선공개 예약`}에만 사용하며 GA, Clarity, Meta 이벤트에는 보내지 않아요.
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
