// [확정 분기] 클립보드 로컬 헬퍼 — lib/share.ts 비의존 (소유 경계).
// navigator.clipboard 우선, 권한 거부·비보안 컨텍스트는 execCommand 폴백.

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* 폴백으로 계속 */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
