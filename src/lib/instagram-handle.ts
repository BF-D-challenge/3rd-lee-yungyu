import { z } from "zod";

export const INSTAGRAM_HANDLE_STORAGE_KEY = "oneul:reservation-instagram:v1";

const pendingInstagramHandleKey = (product?: string) =>
  product ? `${INSTAGRAM_HANDLE_STORAGE_KEY}:${product}` : INSTAGRAM_HANDLE_STORAGE_KEY;

export const instagramHandleSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@+/, "").toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Instagram 아이디를 입력해 주세요.")
      .max(30, "Instagram 아이디는 30자 이하로 입력해 주세요.")
      .regex(
        /^[a-z0-9._]+$/,
        "영문, 숫자, 마침표, 밑줄만 입력할 수 있어요.",
      )
      .regex(
        /^[a-z0-9_](?:[a-z0-9._]*[a-z0-9_])?$/,
        "마침표는 아이디의 처음이나 끝에 사용할 수 없어요.",
      )
      .refine(
        (value) => !value.includes(".."),
        "마침표는 연속해서 사용할 수 없어요.",
      ),
  );

export function normalizeInstagramHandle(value: string): string | null {
  const parsed = instagramHandleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function instagramHandleError(value: string): string {
  const parsed = instagramHandleSchema.safeParse(value);
  return parsed.success ? "" : parsed.error.issues[0]?.message ?? "아이디를 확인해 주세요.";
}

export function loadPendingInstagramHandle(product?: string): string {
  try {
    return normalizeInstagramHandle(
      sessionStorage.getItem(pendingInstagramHandleKey(product)) ?? "",
    ) ?? "";
  } catch {
    return "";
  }
}

export function savePendingInstagramHandle(value: string, product?: string): string | null {
  const handle = normalizeInstagramHandle(value);
  if (!handle) {
    try {
      sessionStorage.removeItem(pendingInstagramHandleKey(product));
    } catch {
      // 저장소가 막혀도 현재 폼 검증은 계속 동작한다.
    }
    return null;
  }
  try {
    sessionStorage.setItem(pendingInstagramHandleKey(product), handle);
  } catch {
    // OAuth 복귀 뒤 입력을 복원하지 못해도 예약 화면에서 다시 입력할 수 있다.
  }
  return handle;
}
