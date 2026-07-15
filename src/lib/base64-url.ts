/** 이미 바이너리 문자열로 변환된 값을 URL-safe Base64로 인코딩한다. */
export function encodeBinaryBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** URL-safe Base64를 원래 바이너리 문자열로 디코딩한다. */
export function decodeBinaryBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}
